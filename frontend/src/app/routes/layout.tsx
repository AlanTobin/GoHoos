export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
