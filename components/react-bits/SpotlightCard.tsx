// React Bits card shell retained; pointer effects intentionally removed by user request.
// See LICENSE.md / PROVENANCE.md. No hover, glow, shadow or decorative stroke.
import type { ReactNode } from "react";
export default function SpotlightCard({children,className=""}:{children:ReactNode;className?:string}) {
  return <div className={"gr-spotlight "+className} data-react-bits="SpotlightCard" data-effects="disabled">{children}</div>;
}
