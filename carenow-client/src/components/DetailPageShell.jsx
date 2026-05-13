import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Vỏ layout chung: hero gradient + breadcrumb + khung nội dung (giống pattern marketing CareNow).
 */
export function DetailPageShell({
  crumbs,
  title,
  subtitle,
  children,
  heroAside,
}) {
  return (
    <div className="pb-12">
      <section
        className="text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1a6fa3 0%,#3498db 55%,#5dade2 100%)",
        }}
      >
        <div className="absolute -top-24 -right-24 size-96 rounded-full opacity-10 bg-white" />
        <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
          <nav className="text-xs md:text-sm text-blue-100 mb-4 flex flex-wrap items-center gap-1">
            {crumbs.map((c, i) => (
              <Fragment key={c.key}>
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
                {c.to ? (
                  <Link to={c.to} className="hover:text-white underline-offset-2 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{c.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
            {heroAside && <div className="flex justify-center md:justify-end">{heroAside}</div>}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
