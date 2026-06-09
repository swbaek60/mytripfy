import { jsonLdScriptProps } from '@/lib/seo/json-ld'

type Props = { data: Record<string, unknown> }

export default function JsonLdScript({ data }: Props) {
  return <script {...jsonLdScriptProps(data)} />
}
