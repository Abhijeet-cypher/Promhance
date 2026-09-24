export const dynamic = "force-static";

const BASE_URL = "https://www.promhance.com";

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Promhance</ShortName>
  <Description>Search 400+ viral AI prompts in the Promhance Prompt Collection.</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/svg+xml">${BASE_URL}/icon.svg</Image>
  <Url type="text/html" method="get" template="${BASE_URL}/viral-prompts?q={searchTerms}" />
</OpenSearchDescription>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
