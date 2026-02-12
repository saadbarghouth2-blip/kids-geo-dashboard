import clsx from "clsx";

export type Layers = {
  showPlaces: boolean;
  showLabels: boolean;
  showEgypt: boolean;
  showNile: boolean;
  showDelta: boolean;
  showHeat: boolean;
  showCoords: boolean;
};

export default function LayerControls(props: { layers: Layers; setLayers: (v: Layers) => void }) {
  const { layers, setLayers } = props;
  const toggle = (k: keyof Layers) => setLayers({ ...layers, [k]: !layers[k] });

  const Item = (p: { k: keyof Layers; label: string }) => (
    <button className={clsx("btn text-xs", layers[p.k] && "border-white/35 bg-white/10")} onClick={() => toggle(p.k)}>
      {p.label}
    </button>
  );

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="panel-title mb-2">طبقات الخريطة</div>
      <div className="flex flex-wrap gap-2">
        <Item k="showPlaces" label="أماكن" />
        <Item k="showLabels" label="أسماء على الخريطة" />
        <Item k="showEgypt" label="حدود مصر" />
        <Item k="showNile" label="النيل" />
        <Item k="showDelta" label="الدلتا" />
        <Item k="showHeat" label="Glow مناطق" />
        <Item k="showCoords" label="إحداثيات" />
      </div>
    </div>
  );
}
