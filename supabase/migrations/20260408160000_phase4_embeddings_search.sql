create extension if not exists pg_trgm;

alter table public.document_chunks
  add column if not exists content_tsv tsvector;

create index if not exists idx_document_chunks_tsv
  on public.document_chunks using gin(content_tsv);

create or replace function public.document_chunks_tsv_trigger()
returns trigger
language plpgsql
as $$
begin
  new.content_tsv := to_tsvector('simple', coalesce(new.content, ''));
  return new;
end;
$$;

create trigger trg_document_chunks_tsv
before insert or update of content
on public.document_chunks
for each row
execute function public.document_chunks_tsv_trigger();

update public.document_chunks
set content_tsv = to_tsvector('simple', coalesce(content, ''))
where content_tsv is null;

create or replace function public.search_relevant_chunks(
  query_text text,
  query_embedding vector(1536),
  org_id uuid,
  top_k int default 8,
  only_approved boolean default false,
  doc_type_filter text default null,
  tags_filter text[] default null,
  current_only boolean default true,
  include_obsolete boolean default false
)
returns table (
  chunk_id uuid,
  score double precision,
  content text,
  document_id uuid,
  document_name text,
  document_version text,
  page_number integer,
  section_ref text,
  status public.document_status
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      dc.id as chunk_id,
      dc.content,
      rd.id as document_id,
      rd.title as document_name,
      dv.version as document_version,
      dc.page_number,
      dc.section_ref,
      dv.status,
      dv.is_current,
      coalesce(ts_rank(dc.content_tsv, plainto_tsquery('simple', query_text)), 0) as keyword_score,
      1 - (de.embedding <=> query_embedding) as semantic_score,
      case
        when dv.status = 'approved' and dv.is_current = true then 0.25
        when dv.status = 'approved' then 0.15
        when dv.is_current = true then 0.1
        else 0
      end as priority_boost
    from public.document_chunks dc
    join public.document_embeddings de on de.document_chunk_id = dc.id
    join public.document_versions dv on dv.id = dc.document_version_id
    join public.regulatory_documents rd on rd.id = dv.regulatory_document_id
    left join public.document_tags dt on dt.document_version_id = dv.id
    where dc.organization_id = org_id
      and (include_obsolete or dv.status <> 'obsolete')
      and (not only_approved or dv.status = 'approved')
      and (doc_type_filter is null or rd.document_type = doc_type_filter)
      and (not current_only or dv.is_current = true)
      and (tags_filter is null or dt.tag = any(tags_filter))
  )
  select
    chunk_id,
    (0.55 * semantic_score + 0.35 * keyword_score + priority_boost) as score,
    content,
    document_id,
    document_name,
    document_version,
    page_number,
    section_ref,
    status
  from base
  order by score desc
  limit greatest(1, least(top_k, 50));
$$;
