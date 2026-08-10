-- Keep the existing columns for deployment compatibility, but store and display
-- one combined AI comment in text_analysis from now on.
update public.posts
set
  text_analysis = concat_ws(' ', nullif(trim(text_analysis), ''), nullif(trim(image_analysis), '')),
  image_analysis = null
where image_analysis is not null and trim(image_analysis) <> '';

comment on column public.posts.text_analysis is
  'Single AI comment generated from the post text and all uploaded images.';

comment on column public.posts.image_analysis is
  'Legacy field retained for backward compatibility; new writes must be null.';
