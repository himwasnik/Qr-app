import { useAuth } from '../context/AuthContext';
import { Download, ExternalLink } from 'lucide-react';

const QRCodePage = () => {
  const { restaurant, API_URL } = useAuth();
  const menuUrl = `${window.location.origin}/menu/${restaurant?.slug}`;
  const qrPngUrl = `${API_URL.replace('/api', '')}/api/restaurants/${restaurant?.slug}/qr.png`;
  const qrSvgUrl = `${API_URL.replace('/api', '')}/api/restaurants/${restaurant?.slug}/qr.svg`;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">QR Code</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
            <img src={qrPngUrl} alt="QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Download</h2>
          <div className="space-y-3">
            <a
              href={qrPngUrl}
              download={`${restaurant?.slug}-qr.png`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div>
                <p className="font-medium">PNG Format</p>
                <p className="text-sm text-gray-600">Best for printing</p>
              </div>
              <Download className="w-5 h-5 text-blue-600" />
            </a>

            <a
              href={qrSvgUrl}
              download={`${restaurant?.slug}-qr.svg`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div>
                <p className="font-medium">SVG Format</p>
                <p className="text-sm text-gray-600">Scalable vector</p>
              </div>
              <Download className="w-5 h-5 text-blue-600" />
            </a>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Menu URL</h3>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="flex-1 bg-transparent text-sm"
              />
              <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Download the QR code in PNG or SVG format</li>
          <li>• Print and place it on your restaurant tables</li>
          <li>• Customers scan the QR code to view your menu</li>
          <li>• Update your menu anytime from the dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodePage;
