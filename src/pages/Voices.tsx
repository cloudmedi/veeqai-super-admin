import { useState, useEffect } from 'react'
import { adminApiClient } from '@/lib/api-client'
import { Play, Pause, Upload, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react'

interface Voice {
  _id: string
  name: string
  description: string
  audioFile: string
  previewUrl: string
  artwork: string | null
  gender: string
  age: string
  isActive: boolean
  usageCount: number
  createdAt: string
}

export default function Voices() {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gender: 'neutral',
    age: 'adult'
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  
  // Multi-mood form data
  const [multiFormData, setMultiFormData] = useState({
    baseVoiceName: '',
    description: '',
    gender: 'neutral',
    age: 'adult'
  })
  const [moodFiles, setMoodFiles] = useState<{[key: string]: File | null}>({
    commercial: null,
    corporate: null,
    professional: null,
    news: null,
    documentary: null,
    educational: null,
    storytelling: null,
    energetic: null,
    calm: null,
    friendly: null
  })
  const [multiArtworkFile, setMultiArtworkFile] = useState<File | null>(null)
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    gender: 'neutral',
    age: 'adult'
  })
  const [editArtworkFile, setEditArtworkFile] = useState<File | null>(null)
  const [showMultiMoodPage, setShowMultiMoodPage] = useState(false)
  
  // Audio player states (like My Music)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    try {
      const response = await adminApiClient.get<any>('/voices/admin/list')
      if ((response as any).success) {
        setVoices((response as any).voices)
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !audioFile) {
      alert('İsim ve ses dosyası gerekli')
      return
    }

    setUploading(true)
    try {
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('name', formData.name)
      uploadData.append('description', formData.description)
      uploadData.append('gender', formData.gender)
      uploadData.append('age', formData.age)
      uploadData.append('audioFile', audioFile)
      if (artworkFile) {
        uploadData.append('artworkFile', artworkFile)
      }

      const response = await adminApiClient.postFile<any>('/voices/admin/upload', uploadData)
      if ((response as any).success) {
        await fetchVoices()
        setFormData({
          name: '',
          description: '',
          gender: 'neutral',
          age: 'adult'
        })
        setAudioFile(null)
        setArtworkFile(null)
        alert('Ses başarıyla yüklendi!')
      }
    } catch (error) {
      alert('Ses yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  const handleMultiUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!multiFormData.baseVoiceName) {
      alert('Ses grubu ismi gerekli')
      return
    }

    // Check if at least one mood file is selected
    const selectedMoods = Object.entries(moodFiles).filter(([_, file]) => file !== null)
    if (selectedMoods.length === 0) {
      alert('En az bir mood ses dosyası seçin')
      return
    }

    setUploading(true)
    try {
      // Create FormData for multi-mood upload
      const uploadData = new FormData()
      uploadData.append('baseVoiceName', multiFormData.baseVoiceName)
      uploadData.append('description', multiFormData.description)
      uploadData.append('gender', multiFormData.gender)
      uploadData.append('age', multiFormData.age)
      
      // Add mood files
      selectedMoods.forEach(([mood, file]) => {
        if (file) {
          uploadData.append(mood, file)
        }
      })
      
      if (multiArtworkFile) {
        uploadData.append('artworkFile', multiArtworkFile)
      }

      const response = await adminApiClient.postFile<any>('/voices/admin/upload-group', uploadData)
      if ((response as any).success) {
        await fetchVoices()
        setMultiFormData({
          baseVoiceName: '',
          description: '',
          gender: 'neutral',
          age: 'adult'
        })
        setMoodFiles({
          commercial: null,
          corporate: null,
          professional: null,
          news: null,
          documentary: null,
          educational: null,
          storytelling: null,
          energetic: null,
          calm: null,
          friendly: null
        })
        setMultiArtworkFile(null)
        setShowMultiMoodPage(false)
        alert(`${selectedMoods.length} farklı mood ile ses grubu oluşturuldu!`)
      }
    } catch (error) {
      alert('Multi-mood yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  const toggleVoice = async (id: string) => {
    try {
      await adminApiClient.put(`/voices/admin/${id}/toggle`)
      await fetchVoices()
    } catch (error) {
      alert('Durum değiştirilemedi')
    }
  }

  const deleteVoice = async (id: string) => {
    if (!confirm('Bu sesi silmek istediğinize emin misiniz?')) return
    
    try {
      await adminApiClient.delete(`/voices/admin/${id}`)
      await fetchVoices()
    } catch (error) {
      alert('Ses silinemedi')
    }
  }

  const playPreview = (voice: Voice) => {
    if (playingVoiceId === voice._id && isPlaying) {
      // Pause current voice
      currentAudio?.pause()
      setIsPlaying(false)
    } else if (playingVoiceId === voice._id && !isPlaying) {
      // Resume current voice
      currentAudio?.play()
      setIsPlaying(true)
    } else {
      // Play new voice
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }
      
      const audioUrl = voice.audioFile
      
      if (!audioUrl) {
        alert('Ses dosyası bulunamadı')
        return
      }
      
      const audio = new Audio(audioUrl)
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setPlayingVoiceId(null)
        setCurrentAudio(null)
      })
      
      audio.addEventListener('error', (e) => {
        alert('Ses oynatılamadı. Dosya bozuk olabilir.')
        setIsPlaying(false)
        setPlayingVoiceId(null)
        setCurrentAudio(null)
      })
      
      audio.play()
        .then(() => {
          setCurrentAudio(audio)
          setPlayingVoiceId(voice._id)
          setIsPlaying(true)
        })
        .catch((error) => {
          alert('Ses oynatma başarısız: ' + error.message)
        })
    }
  }

  const startEdit = (voice: Voice) => {
    setEditingVoice(voice)
    setEditFormData({
      name: voice.name,
      description: voice.description,
      gender: voice.gender,
      age: voice.age
    })
  }

  const saveEdit = async () => {
    if (!editingVoice) return
    
    try {
      if (editArtworkFile) {
        // If artwork file is selected, use FormData
        const updateData = new FormData()
        updateData.append('name', editFormData.name)
        updateData.append('description', editFormData.description)
        updateData.append('gender', editFormData.gender)
        updateData.append('age', editFormData.age)
        updateData.append('artworkFile', editArtworkFile)
        
        await adminApiClient.putFile(`/voices/admin/${editingVoice._id}`, updateData)
      } else {
        // No artwork file, use JSON
        await adminApiClient.put(`/voices/admin/${editingVoice._id}`, editFormData)
      }
      
      await fetchVoices()
      setEditingVoice(null)
      setEditArtworkFile(null)
      alert('Ses başarıyla güncellendi!')
    } catch (error) {
      alert('Ses güncellenemedi')
    }
  }

  const cancelEdit = () => {
    setEditingVoice(null)
    setEditFormData({
      name: '',
      description: '',
      gender: 'neutral',
      age: 'adult'
    })
    setEditArtworkFile(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Multi-mood tam sayfa kontrolü
  if (showMultiMoodPage) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Multi-Mood Ses Grubu Oluştur</h1>
          <button
            onClick={() => {
              setShowMultiMoodPage(false)
              // Reset form
              setMultiFormData({
                baseVoiceName: '',
                description: '',
                gender: 'neutral',
                age: 'adult'
              })
              setMoodFiles({
                commercial: null,
                corporate: null,
                professional: null,
                news: null,
                documentary: null,
                educational: null,
                storytelling: null,
                energetic: null,
                calm: null,
                friendly: null
              })
              setMultiArtworkFile(null)
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Geri Dön
          </button>
        </div>

        <div>
          <form onSubmit={handleMultiUpload} className="space-y-8">
            {/* Base Voice Info */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">Grup Bilgileri</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ses Grubu İsmi *
                  </label>
                  <input
                    type="text"
                    value={multiFormData.baseVoiceName}
                    onChange={(e) => setMultiFormData({...multiFormData, baseVoiceName: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg text-lg"
                    placeholder="Örn: Ahmet"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cinsiyet
                  </label>
                  <select
                    value={multiFormData.gender}
                    onChange={(e) => setMultiFormData({...multiFormData, gender: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="neutral">Nötr</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yaş Grubu
                  </label>
                  <select
                    value={multiFormData.age}
                    onChange={(e) => setMultiFormData({...multiFormData, age: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="child">Çocuk</option>
                    <option value="young">Genç</option>
                    <option value="adult">Yetişkin</option>
                    <option value="senior">Yaşlı</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={multiFormData.description}
                    onChange={(e) => setMultiFormData({...multiFormData, description: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Bu ses grubunun açıklaması..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grup Artwork (Opsiyonel)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMultiArtworkFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                  {multiArtworkFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {multiArtworkFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mood Files Grid */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">Mood Ses Dosyaları</h3>
              <p className="text-gray-600 mb-6">En az 1 tane mood seçin. Her mood farklı bir tonlama için kullanılacak.</p>
              
              <div className="grid grid-cols-2 gap-6">
                {Object.entries({
                  commercial: { label: 'Commercial', desc: 'Reklam ve tanıtım için enerjik ton' },
                  corporate: { label: 'Corporate', desc: 'Kurumsal sunumlar için resmi ton' },
                  professional: { label: 'Professional', desc: 'İş sunumları için profesyonel ton' },
                  news: { label: 'News', desc: 'Haber spikeri tonu' },
                  documentary: { label: 'Documentary', desc: 'Belgesel anlatım tonu' },
                  educational: { label: 'Educational', desc: 'Eğitim içerikleri için öğretici ton' },
                  storytelling: { label: 'Storytelling', desc: 'Hikaye anlatımı için dramatik ton' },
                  energetic: { label: 'Energetic', desc: 'Enerjik ve dinamik ton' },
                  calm: { label: 'Calm', desc: 'Sakin ve huzurlu ton' },
                  friendly: { label: 'Friendly', desc: 'Samimi ve arkadaşça ton' }
                }).map(([mood, config]) => (
                  <div key={mood} className={`border rounded-lg p-4 transition-colors ${
                    moodFiles[mood] ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800">{config.label}</h4>
                      <p className="text-sm text-gray-600">{config.desc}</p>
                    </div>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setMoodFiles({
                        ...moodFiles,
                        [mood]: e.target.files?.[0] || null
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    {moodFiles[mood] && (
                      <p className="mt-2 text-sm text-green-600 font-medium">
                        ✓ {moodFiles[mood]?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || Object.values(moodFiles).every(file => !file) || !multiFormData.baseVoiceName}
                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="h-5 w-5" />
                {uploading ? 'Multi-Mood Grup Oluşturuluyor...' : 'Multi-Mood Grup Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Models</h1>
          <p className="mt-2 text-gray-600">Manage voice models and multi-mood groups</p>
        </div>
        <button
          onClick={() => setShowMultiMoodPage(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Voice
        </button>
      </div>

      {/* Voices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artwork</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İsim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cinsiyet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yaş</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanım</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {voices.map((voice) => (
              <tr key={voice._id}>
                <td className="px-6 py-4">
                  <div className="relative w-12 h-12">
                    {voice.artwork ? (
                      <img 
                        src={voice.artwork} 
                        alt={voice.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                    {/* Play button overlay */}
                    <button
                      onClick={() => playPreview(voice)}
                      className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      title={playingVoiceId === voice._id && isPlaying ? "Durdur" : "Orijinal Sesi Dinle"}
                    >
                      {playingVoiceId === voice._id && isPlaying ? (
                        <Pause className="h-6 w-6 text-white" />
                      ) : (
                        <Play className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {voice.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voice.description}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voice.gender === 'male' ? 'Erkek' : voice.gender === 'female' ? 'Kadın' : 'Nötr'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voice.age === 'child' ? 'Çocuk' : 
                   voice.age === 'young' ? 'Genç' :
                   voice.age === 'adult' ? 'Yetişkin' : 'Yaşlı'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voice.usageCount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    voice.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {voice.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(voice)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4 text-orange-600" />
                    </button>
                    <button
                      onClick={() => toggleVoice(voice._id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Aktif/Pasif"
                    >
                      {voice.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteVoice(voice._id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingVoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Ses Düzenle</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ses İsmi
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cinsiyet
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="neutral">Nötr</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yaş Grubu
                  </label>
                  <select
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="child">Çocuk</option>
                    <option value="young">Genç</option>
                    <option value="adult">Yetişkin</option>
                    <option value="senior">Yaşlı</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artwork (Opsiyonel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditArtworkFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {editArtworkFile && (
                  <p className="mt-1 text-sm text-gray-600">
                    Seçili: {editArtworkFile.name}
                  </p>
                )}
                {editingVoice.artwork && !editArtworkFile && (
                  <p className="mt-1 text-sm text-gray-500">
                    Mevcut artwork var. Değiştirmek için yeni resim seçin.
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}