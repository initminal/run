import { Metadata } from 'next'
import Content from './content'

export const metadata: Metadata = {
  title: 'Playground | Run | Initminal',
}

export default function Page() {
  return <Content />
}
