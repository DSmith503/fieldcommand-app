import { useState } from 'react';
import { Card, PageHeader, Input, Badge } from '../components/UI';
import { Phone, Mail, Globe, Search } from 'lucide-react';

const V = [
  // Lighting & Controls
  {c:"Lighting & Controls",n:"Lutron",p:"(800) 523-9466",e:"support@lutron.com",w:"lutron.com/support",d:"24/7 tech support. Customer svc: (844) 588-7661"},
  {c:"Lighting & Controls",n:"Vantage Controls",p:"(860) 564-4512",e:"support@vantagecontrols.com",w:"dealer.vantagecontrols.com",d:"Legrand brand. Dealer portal for tech support."},
  {c:"Lighting & Controls",n:"Philips Hue",p:"(800) 555-0050",e:"support via hue.philips.com",w:"hue.philips.com",d:"Signify brand. Smart lighting & accessories."},
  {c:"Lighting & Controls",n:"DMF Lighting",p:"(800) 285-5411",e:"support@dmflighting.com",w:"dmflighting.com",d:"High-performance LED recessed lighting."},
  {c:"Lighting & Controls",n:"Lotus LED",p:"(877) 956-8871",e:"info@lotusledlights.com",w:"lotusledlights.com",d:"Slim LED recessed downlights."},
  {c:"Lighting & Controls",n:"Elemental LED",p:"(877) 564-5051",e:"support@elementalled.com",w:"elementalled.com",d:"LED strips, channels & commercial lighting."},
  {c:"Lighting & Controls",n:"Diode LED",p:"(866) 813-1443",e:"customerservice@dfrtech.com",w:"diodeled.com",d:"Elemental LED brand. Tape light & LED drivers."},
  {c:"Lighting & Controls",n:"WAC Lighting",p:"(800) 526-2588",e:"sales@waclighting.com",w:"waclighting.com",d:"Decorative, landscape & track lighting."},
  {c:"Lighting & Controls",n:"Visual Comfort",p:"(713) 686-5999",e:"info@visualcomfort.com",w:"visualcomfort.com",d:"Designer lighting. Houston, TX."},
  {c:"Lighting & Controls",n:"Leviton",p:"(800) 323-8920",e:"support@leviton.com",w:"leviton.com/support",d:"Dimmers, switches, load centers."},
  {c:"Lighting & Controls",n:"Garden Light LED",p:"(855) 886-3435",e:"info@gardenlightled.com",w:"gardenlightled.com",d:"Outdoor landscape LED lighting."},
  {c:"Lighting & Controls",n:"FX Luminaire",p:"(800) 688-1269",e:"support@fxl.com",w:"fxl.com",d:"Landscape & architectural lighting. Hunter brand."},
  // Automation & Control
  {c:"Automation & Control",n:"Control4",p:"(888) 400-4070",e:"support@control4.com",w:"help.control4.com",d:"Snap One brand. Dealer: customers@control4.com"},
  {c:"Automation & Control",n:"Snap One",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"snapav.com/contact",d:"Orders: (866) 424-4489. Returns: (877) 353-4713"},
  {c:"Automation & Control",n:"Savant",p:"(877) 728-2685",e:"support@savant.com",w:"savant.com/support",d:"HQ: (508) 683-2500"},
  {c:"Automation & Control",n:"Crestron",p:"(800) 237-2041",e:"support@crestron.com",w:"support.crestron.com",d:"Blue Ribbon Tech Support. Chat available online."},
  {c:"Automation & Control",n:"RTI",p:"(952) 253-3100",e:"support@rfremotetechnologies.com",w:"rfremotetechnologies.com",d:"Remote Technologies Inc."},
  {c:"Automation & Control",n:"Josh AI",p:"(720) 870-5674",e:"support@josh.ai",w:"josh.ai",d:"AI-powered voice control for smart homes."},
  {c:"Automation & Control",n:"URC",p:"(914) 835-4484",e:"support@universalremote.com",w:"universalremote.com",d:"Universal Remote Control."},
  {c:"Automation & Control",n:"Bond Bridge",p:"N/A",e:"support@bondhome.io",w:"bondhome.io",d:"RF/IR bridge for fans, shades."},
  // Networking
  {c:"Networking",n:"Araknis",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"araknisnetworks.com",d:"Snap One brand."},
  {c:"Networking",n:"Ubiquiti",p:"(408) 942-3085",e:"support via ui.com",w:"ui.com/support",d:"UniFi networking. Community + ticket support."},
  {c:"Networking",n:"Access Networks",p:"(949) 243-0100",e:"support@accessca.com",w:"accessnetworks.com",d:"Managed home networks. Irvine, CA."},
  {c:"Networking",n:"Ruckus",p:"(855) 478-2587",e:"support via ruckusnetworks.com",w:"ruckusnetworks.com",d:"CommScope brand. Enterprise Wi-Fi."},
  {c:"Networking",n:"Cisco",p:"(800) 553-2447",e:"support via cisco.com",w:"cisco.com/support",d:"Meraki: (415) 432-1000."},
  {c:"Networking",n:"Cleerline",p:"(800) 422-2537",e:"info@cleerlinetech.com",w:"cleerlinetech.com",d:"Fiber optic cabling solutions."},
  // Audio
  {c:"Audio",n:"Sonos",p:"(800) 680-2345",e:"support@sonos.com",w:"support.sonos.com",d:"Mon-Fri 9am-8pm, Sat 10am-5:30pm ET."},
  {c:"Audio",n:"Sonance",p:"(949) 492-7777",e:"techsupport@sonance.com",w:"sonance.com/support",d:"Dana Innovations. San Clemente, CA."},
  {c:"Audio",n:"James Loudspeakers",p:"(775) 461-7500",e:"info@jamesloudspeaker.com",w:"jamesloudspeaker.com",d:"Custom built-to-order speakers."},
  {c:"Audio",n:"Origin Acoustics",p:"(855) 674-4461",e:"support@originacoustics.com",w:"originacoustics.com",d:"Formerly SpeakerCraft."},
  {c:"Audio",n:"Russound",p:"(603) 659-5170",e:"tech@russound.com",w:"russound.com",d:"Multi-room audio systems."},
  {c:"Audio",n:"McIntosh",p:"(607) 723-3512",e:"support@mcintoshlabs.com",w:"mcintoshlabs.com",d:"Premium hi-fi since 1949."},
  {c:"Audio",n:"Marantz",p:"(800) 654-6633",e:"support@masimoglobal.com",w:"marantz.com/support",d:"Masimo Consumer."},
  {c:"Audio",n:"Denon",p:"(800) 654-6633",e:"support@masimoglobal.com",w:"denon.com/support",d:"AV receivers."},
  {c:"Audio",n:"Yamaha",p:"(800) 292-2982",e:"support@yamaha.com",w:"yamaha.com/support",d:"AV receivers & home entertainment."},
  // Video & Display
  {c:"Video & Display",n:"Sony Pro",p:"(866) 769-7669",e:"prosupport@sony.com",w:"pro.sony",d:"Pro displays & projectors."},
  {c:"Video & Display",n:"Samsung Business",p:"(866) 726-4249",e:"support via samsung.com",w:"samsung.com/business",d:"Commercial displays."},
  {c:"Video & Display",n:"LG Business",p:"(800) 243-0000",e:"support via lg.com",w:"lg.com/business",d:"OLED & commercial displays."},
  {c:"Video & Display",n:"Epson",p:"(562) 981-3840",e:"support via epson.com",w:"epson.com/support",d:"Projectors & large-format displays."},
  {c:"Video & Display",n:"Screen Innovations",p:"(512) 832-6939",e:"support@screeninnovations.com",w:"screeninnovations.com",d:"Motorized projection screens."},
  {c:"Video & Display",n:"AV Pro Edge",p:"(605) 274-6055",e:"support@avproedge.com",w:"avproedge.com",d:"HDMI distribution & AV over IP."},
  // Shading & Motorized
  {c:"Shading",n:"Lutron Shading",p:"(844) 588-7661",e:"support@lutron.com",w:"lutron.com/shading",d:"Serena, Palladiom, Triathlon shades."},
  {c:"Shading",n:"Hunter Douglas",p:"(800) 789-0331",e:"support via hunterdouglas.com",w:"hunterdouglas.com",d:"PowerView motorized shades."},
  {c:"Shading",n:"Somfy",p:"(800) 227-6639",e:"support@somfysystems.com",w:"somfysystems.com",d:"Motors for shades & awnings."},
  // Security & Surveillance
  {c:"Security",n:"Luma",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"snapav.com",d:"Snap One brand. Surveillance cameras."},
  {c:"Security",n:"IC Realtime",p:"(877) 424-2527",e:"support@icrealtime.com",w:"icrealtime.com",d:"Ella & IC Series cameras."},
  {c:"Security",n:"DoorBird",p:"+43 1 236 7000",e:"support@doorbird.com",w:"doorbird.com",d:"IP video door stations."},
  {c:"Security",n:"Ring",p:"(800) 656-1918",e:"support via ring.com",w:"ring.com/support",d:"Amazon brand. Video doorbells."},
  {c:"Security",n:"2GIG",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"2gig.com",d:"Snap One brand. Security panels."},
  // Power & Electrical
  {c:"Power & Electrical",n:"Panamax",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"pfremotetechnologies.com",d:"Snap One brand. Surge protection."},
  {c:"Power & Electrical",n:"SurgeX",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"surgex.com",d:"Snap One brand. Advanced surge elimination."},
  {c:"Power & Electrical",n:"Furman",p:"(707) 763-1010",e:"support@furmanpower.com",w:"furmanpower.com",d:"Power conditioning for A/V."},
  {c:"Power & Electrical",n:"Middle Atlantic",p:"(973) 839-1011",e:"sales@middleatlantic.com",w:"middleatlantic.com",d:"Legrand brand. Racks & power."},
  // Infrastructure & Cabling
  {c:"Infrastructure",n:"SnapAV Binary",p:"(866) 838-5052",e:"techsupport@snapone.com",w:"snapav.com",d:"HDMI, audio, and Cat cables."},
  {c:"Infrastructure",n:"Liberty AV",p:"(800) 530-8998",e:"info@libav.com",w:"libav.com",d:"AV cables & adapters. Colorado Springs, CO."},
  {c:"Infrastructure",n:"Metra Home Theater",p:"(386) 255-0234",e:"support@metrahometheater.com",w:"metrahometheater.com",d:"Cables, mounts, tools."},
];

const CATS = ["All", ...Array.from(new Set(V.map(v => v.c)))];

export default function Support() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = V.filter(v => {
    const matchCat = cat === 'All' || v.c === cat;
    const matchSearch = !search || v.n.toLowerCase().includes(search.toLowerCase()) || v.c.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <PageHeader title="Vendor Support" subtitle={V.length + " vendors — quick access to tech support for all your brands"} />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..."
          className="w-full bg-white/[0.025] border border-white/[0.06] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {CATS.map(c => {
          const count = c === 'All' ? V.length : V.filter(v => v.c === c).length;
          return <button key={c} onClick={() => setCat(c)} className={`text-xs px-3 py-1.5 rounded-xl transition-colors ${cat === c ? 'bg-brand-400/10 text-brand-400 border border-brand-400/30' : 'text-zinc-500 hover:text-zinc-300 border border-white/[0.06]'}`}>
            {c} ({count})
          </button>;
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((v, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-semibold text-zinc-100">{v.n}</p>
                <Badge>{v.c}</Badge>
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              {v.p && v.p !== 'N/A' && <a href={"tel:" + v.p.replace(/[^\d+]/g, '')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-brand-400 transition-colors"><Phone className="w-3.5 h-3.5" />{v.p}</a>}
              {v.e && <a href={"mailto:" + v.e} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-blue-400 transition-colors"><Mail className="w-3.5 h-3.5" />{v.e}</a>}
              {v.w && <a href={"https://" + v.w} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"><Globe className="w-3.5 h-3.5" />{v.w}</a>}
            </div>
            {v.d && <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">{v.d}</p>}
          </Card>
        ))}
      </div>

      {!filtered.length && <div className="text-center py-12 text-zinc-500">No vendors match your search</div>}
    </div>
  );
}
