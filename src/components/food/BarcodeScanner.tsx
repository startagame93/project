import { useEffect, useRef, useState } from 'react';
import { ScanBarcode, Search, Loader2, CameraOff, Check } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { uid } from '@/lib/data';
import { isValidBarcode, lookupBarcode, type ScannedProduct } from '@/lib/openFoodFacts';
import type { CustomFoodEntry } from '@/types';

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

const FIELDS: [keyof ScannedProduct, string, string][] = [
  ['calories', 'Calorie', 'kcal'],
  ['protein', 'Proteine', 'g'],
  ['carbs', 'Carboidrati', 'g'],
  ['fat', 'Grassi', 'g'],
  ['saturatedFat', 'Grassi saturi', 'g'],
  ['sugar', 'Zuccheri', 'g'],
  ['fiber', 'Fibre', 'g'],
  ['sodium', 'Sodio', 'mg'],
];

const EMPTY: ScannedProduct = {
  name: '', calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: 0, sugar: 0, fiber: 0, sodium: 0,
};

export function BarcodeScanner({ onClose, onSave }: {
  onClose: () => void;
  onSave: (food: CustomFoodEntry) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [product, setProduct] = useState<ScannedProduct | null>(null);

  useEffect(() => {
    if (!scanning) return;
    const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('La lettura automatica non e disponibile su questo dispositivo. Inserisci il codice a mano.');
      return;
    }
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            const value = found[0]?.rawValue;
            if (value && isValidBarcode(value)) {
              setCode(value);
              setScanning(false);
              void search(value);
              return;
            }
          } catch {
            // frame not ready yet
          }
          timer = window.setTimeout(tick, 350);
        };
        tick();
      } catch (err) {
        console.error('camera error', err);
        setCameraError('Impossibile accedere alla fotocamera. Controlla i permessi oppure inserisci il codice a mano.');
      }
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  async function search(value = code) {
    const clean = value.replace(/\s/g, '');
    if (!isValidBarcode(clean)) {
      setMessage('Il codice deve contenere solo numeri (da 6 a 14 cifre).');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const found = await lookupBarcode(clean);
      if (found) setProduct(found);
      else {
        setProduct({ ...EMPTY, name: `Prodotto ${clean}` });
        setMessage('Prodotto non trovato. Puoi inserire tu i valori riportati in etichetta (per 100 g).');
      }
    } catch (err) {
      console.error('barcode lookup failed', err);
      setProduct({ ...EMPTY, name: `Prodotto ${clean}` });
      setMessage('Ricerca non riuscita (connessione assente?). Inserisci i valori a mano.');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }

  function save() {
    if (!product || !product.name.trim()) return;
    onSave({
      id: uid(),
      name: product.name.trim(),
      category: 'Snack / Dolci',
      calories: product.calories, protein: product.protein, carbs: product.carbs, fat: product.fat,
      saturatedFat: product.saturatedFat, sugar: product.sugar, fiber: product.fiber, sodium: product.sodium,
      potassium: 0, calcium: 0, iron: 0,
    });
  }

  return (
    <Sheet open onClose={onClose} icon={ScanBarcode} title="Scannerizza Prodotto">
      <div className="space-y-4">
        {!product && (
          <>
            {scanning && !cameraError && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/80 rounded-xl" />
                <div className="absolute inset-x-10 top-1/2 h-0.5 bg-error-500 animate-pulse" />
                <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/90">Inquadra il codice a barre</p>
              </div>
            )}
            {cameraError && (
              <div className="flex items-start gap-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 p-3 text-sm text-warning-800 dark:text-warning-300">
                <CameraOff className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{cameraError}</span>
              </div>
            )}
            <div>
              <label className="label" htmlFor="barcode-input">Codice a barre</label>
              <div className="flex gap-2">
                <input
                  id="barcode-input"
                  className="input flex-1"
                  inputMode="numeric"
                  placeholder="es. 8001234567890"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 14))}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                />
                <button onClick={() => search()} disabled={loading || !code} className="btn-primary px-4" aria-label="Cerca codice">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {message && <p className="text-sm text-warning-700 dark:text-warning-400">{message}</p>}

        {product && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="label" htmlFor="scan-name">Nome prodotto</label>
              <input
                id="scan-name"
                className="input"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">Valori per 100 g, puoi correggerli se serve.</p>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(([key, label, unit]) => (
                <label key={key} className="block">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label} ({unit})</span>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className="input mt-1"
                    value={product[key] as number}
                    onChange={(e) => setProduct({ ...product, [key]: Math.max(0, parseFloat(e.target.value) || 0) })}
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setProduct(null); setMessage(''); setCode(''); setCameraError(''); setScanning(true); }}
                className="btn-secondary flex-1"
              >
                <ScanBarcode className="w-4 h-4" /> Riprova
              </button>
              <button onClick={save} disabled={!product.name.trim()} className="btn-primary flex-1">
                <Check className="w-4 h-4" /> Salva e scegli grammi
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
