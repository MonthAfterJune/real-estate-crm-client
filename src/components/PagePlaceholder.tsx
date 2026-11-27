type PagePlaceholderProps = {
  title: string
  description: string
}

export default function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <>
      <div className="mb-5.5 flex items-end justify-between gap-5">
        <h1 className="m-0 font-display text-[26px] font-medium tracking-[-0.01em]">{title}</h1>
      </div>
      <section className="overflow-hidden rounded-md border border-line bg-surface shadow-panel p-4.5">
        <p className="mt-1 text-[13px] text-ink-soft">{description}</p>
      </section>
    </>
  )
}
