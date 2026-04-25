import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScanSuccess: (musicianId: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanRegionId = 'qr-scanner-region';

  useEffect(() => {
    console.log('QRScanner component mounted');
    setIsMounted(true);
    
    // Start scanner immediately when component mounts
    if (!showFallback) {
      console.log('Auto-starting scanner...');
      setScanning(true);
    }
    
    return () => {
      console.log('QRScanner component unmounting - cleaning up...');
      setIsMounted(false);
      
      // Cleanup scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            return scannerRef.current?.clear();
          }).catch((error) => {
            console.error('Error during cleanup:', error);
          }).finally(() => {
            scannerRef.current = null;
          });
        } catch (error) {
          console.error('Cleanup error:', error);
          scannerRef.current = null;
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isMounted && scanning && !showFallback) {
      console.log('Starting scanner...');
      startScanner();
    }
  }, [isMounted, scanning, showFallback]);

  const startScanner = async () => {
    console.log('Initializing scanner...');
    
    try {
      // Request camera permission first
      console.log('Requesting camera permission...');
      await requestCameraPermission();
      
      console.log('Creating Html5Qrcode instance...');
      const scanner = new Html5Qrcode(scanRegionId);
      scannerRef.current = scanner;

      // Try different camera configurations
      const cameraConfigs = [
        // Try back camera first
        { facingMode: 'environment' },
        // Try front camera
        { facingMode: 'user' },
        // Try any camera
        { facingMode: 'environment' }
      ];

      let cameraStarted = false;
      let lastError = null;

      for (const config of cameraConfigs) {
        try {
          console.log('Trying camera config:', config);
          
          await scanner.start(
            config,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              console.log('QR Code scanned successfully:', decodedText);
              handleScanSuccess(decodedText);
            },
            (error) => {
              // Only log errors, don't show to user
              if (error && !error?.includes('QR code')) {
                console.warn('QR scan warning:', error);
              }
            }
          );
          
          cameraStarted = true;
          console.log('Camera started successfully');
          break;
        } catch (error) {
          console.warn('Failed to start camera with config:', config, error);
          lastError = error;
          
          // Clean up failed attempt
          try {
            await scanner.stop();
          } catch (stopError) {
            console.warn('Error stopping scanner:', stopError);
          }
        }
      }

      if (!cameraStarted) {
        throw lastError || new Error('Failed to start camera with any configuration');
      }

    } catch (error) {
      console.error('Scanner initialization error:', error);
      
      // Detailed error logging
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          console.error('No camera found');
          setPermissionError('No camera found on this device. Please use manual entry.');
        } else if (error.name === 'NotAllowedError') {
          console.error('Camera permission denied');
          setPermissionError('Camera access denied. Please allow camera permissions to scan QR codes.');
        } else if (error.name === 'NotReadableError') {
          console.error('Camera already in use');
          setPermissionError('Camera is already in use by another application. Please close other apps and try again.');
        } else {
          console.error('Unknown DOMException:', error);
          setPermissionError(`Camera error: ${error.message}`);
        }
      } else {
        console.error('Unknown error:', error);
        setPermissionError('Unable to access camera. Please check camera permissions.');
      }
      
      setShowFallback(true);
    }
  };

  const requestCameraPermission = async () => {
    console.log('Requesting camera permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log('Camera permission granted');
      stream.getTracks().forEach(track => track.stop());
      setPermissionError('');
    } catch (error) {
      console.error('Camera permission error:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setPermissionError('Camera permission was denied. Please allow camera permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No camera found on this device.');
        } else {
          setPermissionError(`Camera permission error: ${error.message}`);
        }
      } else {
        setPermissionError('Failed to access camera. Please check camera permissions.');
      }
      
      throw error;
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);
    
    try {
      // Parse URL to extract musician ID
      const url = new URL(decodedText);
      const musicianId = url.searchParams.get('musician');
      
      if (musicianId) {
        // Stop scanner before calling success callback
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
            scannerRef.current = null;
          } catch (error) {
            console.error('Error stopping scanner after success:', error);
          }
        }
        
        onScanSuccess(musicianId);
      } else {
        toast({
          title: 'Invalid QR Code',
          description: 'This QR code is not a valid musician QR code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Invalid QR Code',
        description: 'Please scan a valid musician QR code',
        variant: 'destructive'
      });
    }
  };

  const handleClose = async () => {
    console.log('Closing QR Scanner...');
    
    try {
      if (scannerRef.current) {
        console.log('Stopping scanner...');
        await scannerRef.current.stop();
        console.log('Scanner stopped successfully');
        
        // Clear the scanner instance
        await scannerRef.current.clear();
        console.log('Scanner cleared successfully');
        
        scannerRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
      // Don't throw error, just log it
    } finally {
      // Reset state
      setScanning(false);
      setIsMounted(false);
      
      console.log('Calling onClose callback...');
      onClose();
    }
  };

  const handleManualSubmit = async () => {
    if (manualInput.trim()) {
      // Stop scanner before submitting
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
        } catch (error) {
          console.error('Error stopping scanner after manual submit:', error);
        }
      }
      
      // Try to extract musician ID from manual input
      const match = manualInput.match(/musician=([a-f0-9-]+)/i);
      if (match && match[1]) {
        onScanSuccess(match[1]);
      } else {
        // Try to treat as direct musician ID
        onScanSuccess(manualInput.trim());
      }
    }
  };

  const requestCameraPermissionAgain = async () => {
    console.log('Requesting camera permission again...');
    try {
      // Force permission request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log('Camera permission granted on retry');
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionError('');
      setShowFallback(false);
      setScanning(true);
    } catch (error) {
      console.error('Camera permission retry error:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setPermissionError('Camera permission was denied. Please allow camera permissions in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No camera found on this device. Please use manual entry.');
        } else {
          setPermissionError(`Camera error: ${error.message}`);
        }
      } else {
        setPermissionError('Failed to access camera. Please check camera permissions.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!showFallback ? (
            <div className="space-y-4">
              {permissionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{permissionError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestCameraPermissionAgain}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              <div className="text-center">
                <Camera className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Position the QR code within the frame to scan
                </p>
              </div>
              
              <div id={scanRegionId} className="qr-scanner" />
              
              <Button
                variant="outline"
                onClick={() => setShowFallback(true)}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                Can't scan? Enter manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Search className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium mb-2">Manual Entry</h4>
                <p className="text-sm text-gray-600">
                  Enter musician ID or paste QR code URL
                </p>
              </div>
              
              <Input
                placeholder="Enter musician ID or paste URL..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFallback(false);
                    setScanning(true);
                  }}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Try Scanner
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
