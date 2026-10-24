const shapes = {
  leaf: 'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl',
  rounded: 'rounded-2xl',
};

export default function Card({ children, shape = 'leaf', className = '' }) {
  return (
    // isolate + -z-10 on the glow keeps it behind the content, so children
    // go straight into the section and layout classes (flex, grid) work.
    <section
      className={`group relative isolate overflow-hidden border-2 border-lime-300/70 bg-gradient-to-br from-yellow-200 via-lime-200 to-green-300 bg-[length:200%_200%] bg-left-top p-6 text-green-950 shadow-md shadow-green-900/10 transition-all duration-500 hover:border-green-600 hover:bg-right-bottom hover:shadow-xl hover:shadow-green-700/25 focus-within:ring-2 focus-within:ring-green-700 focus-within:ring-offset-2 motion-safe:hover:-translate-y-1.5 ${shapes[shape] || shapes.leaf} ${className}`}
    >
      {/* soft glow that expands on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-yellow-100/70 transition-transform duration-500 motion-safe:group-hover:scale-[2.4]"
      />
      {children}
    </section>
  );
}
