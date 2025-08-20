import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Play, Download, Volume2, VolumeX, Clock, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/axios'

interface TestModelModalProps {
  isOpen: boolean
  onClose: () => void
  model: any
}

export default function TestModelModal({ isOpen, onClose, model }: TestModelModalProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(30)
  const [lyrics, setLyrics] = useState('')
  const [style, setStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  const handleTest = async () => {
    if (!prompt.trim()) {
      setError('Prompt gerekli')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = localStorage.getItem('adminToken')
      
      const testData = {
        prompt: prompt.trim(),
        duration: duration,
        ...(model.type === 'tts' && lyrics.trim() && { lyrics: lyrics.trim() }),
        ...(style.trim() && { style: style.trim() })
      }

      // Test generation endpoint'i
      const response = await api.post(`/api/admin/models/${model._id}/test`, testData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setResult({
        success: true,
        audioUrl: response.data.audioUrl || '#', // Mock URL for now
        duration: response.data.duration || duration,
        generatedAt: new Date().toISOString(),
        cost: response.data.cost || (model.pricing?.baseCost || 0),
        processingTime: response.data.processingTime || 15.2
      })
      
    } catch (error: any) {
      setError(error.response?.data?.error || 'Model test edilemedi')
      setResult({
        success: false,
        error: error.response?.data?.error || 'Model test edilemedi'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAudioToggle = () => {
    setIsPlaying(!isPlaying)
    // TODO: Gerçek audio player implementasyonu
  }

  const handleDownload = () => {
    if (result?.audioUrl && result.audioUrl !== '#') {
      window.open(result.audioUrl, '_blank')
    }
  }

  const resetTest = () => {
    setResult(null)
    setError('')
    setPrompt('')
    setLyrics('')
    setStyle('')
  }

  if (!model) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'music': return '🎵'
      case 'tts': return '🗣️'
      case 'voice-clone': return '👤'
      case 'voice-design': return '🎨'
      case 'voice-isolator': return '🔊'
      default: return '🤖'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test Model - ${model.displayName}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Model Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getTypeIcon(model.type)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{model.displayName}</h3>
              <p className="text-sm text-gray-600">{model.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div>
              <span className="text-gray-500">Provider:</span>
              <div className="font-medium">{model.provider?.name}</div>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <div className="font-medium">{model.type}</div>
            </div>
            <div>
              <span className="text-gray-500">Cost:</span>
              <div className="font-medium">${model.pricing?.baseCost} {model.pricing?.model}</div>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <div className={`font-medium ${model.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {model.status}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!result ? (
          /* Test Form */
          <form onSubmit={(e) => { e.preventDefault(); handleTest(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={model.type === 'music' ? 
                  "Describe the music you want to generate (e.g., upbeat electronic dance music with heavy bass)" :
                  "Enter text to convert to speech"
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="240"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style (optional)
                </label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g., jazz, rock, classical"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {model.type === 'tts' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lyrics (for TTS models)
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter lyrics or text to be spoken"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !prompt.trim()} className="min-w-[120px]">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Test Model
                  </div>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Test Results */
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </h3>
              </div>
              {result.success ? (
                <p className="text-sm text-green-700">
                  Model tested successfully. Audio generated in {result.processingTime}s.
                </p>
              ) : (
                <p className="text-sm text-red-700">
                  {result.error}
                </p>
              )}
            </div>

            {result.success && (
              <>
                {/* Audio Player */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Generated Audio</h4>
                    <div className="text-sm text-gray-600">
                      {result.duration}s • Generated {new Date(result.generatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleAudioToggle}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          Play
                        </>
                      )}
                    </Button>

                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-0"></div>
                    </div>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Note: Bu bir test generation'dır. Gerçek audio oynatma özelliği backend entegrasyonu ile eklenecek.
                  </div>
                </div>

                {/* Test Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Processing Time</div>
                    <div className="text-lg font-semibold text-blue-600">{result.processingTime}s</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="text-lg font-semibold text-green-600">{result.duration}s</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Cost</div>
                    <div className="text-lg font-semibold text-purple-600">${result.cost.toFixed(4)}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="text-lg font-semibold text-green-600">Success</div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={resetTest} variant="outline">
                Test Again
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}