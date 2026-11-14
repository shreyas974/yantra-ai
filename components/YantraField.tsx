import Tilt from './Tilt';
import Torus3D from './Torus3D';

/** Hero artwork: a live 3D torus of signal paths inside a tilting frame. */
export default function YantraField() {
  return <Tilt max={7}><div className="yantra-field" aria-hidden="true"><div className="field-grid" /><span className="field-corner corner-tl" /><span className="field-corner corner-tr" /><span className="field-corner corner-bl" /><span className="field-corner corner-br" /><div className="field-label depth-1"><span className="signal-dot" /> IDEAS IN MOTION<span>HUMAN × MACHINE</span></div><Torus3D className="torus-art" /><div className="field-caption depth-1"><span lang="hi">यन्त्र</span><p>A space for ideas<br />to become something real.</p><span className="field-plus">+</span></div></div></Tilt>;
}
