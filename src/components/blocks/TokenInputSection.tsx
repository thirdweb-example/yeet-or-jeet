export function TokenInputSection(props: { address: string }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight mb-1">Token</h2>
      <p className="text-muted-foreground"> {props.address}</p>
    </section>
  );
}
