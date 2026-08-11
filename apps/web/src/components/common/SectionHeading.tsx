export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-[28px] sm:text-[30px]">{title}</h2>
      <div className="mx-auto mt-3.5 h-0.5 w-11 bg-gold" />
    </div>
  );
}
