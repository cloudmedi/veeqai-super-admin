import { useState, useEffect } from 'react';
import axios from '../lib/axios';

interface Music {
  _id: string;
  title: string;
  prompt: string;
  audioUrl?: string;
  cdnUrl?: string;
  artworkUrl?: string;
  artworkData?: any;
  duration?: number;
  status: string;
  createdAt: string;
  progress?: number;
  estimatedTime?: number;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  featured: {
    isActive: boolean;
    category?: string;
    subcategory?: string;
    order?: number;
    tags?: string[];
    artwork?: {
      cdnUrl?: string;
      fileName?: string;
    };
    engagement?: {
      views: number;
      plays: number;
      downloads: number;
    };
  };
}

export default function Music() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'generate' | 'my-music' | 'all-users'>('generate');
  
  // Music states
  const [myMusic, setMyMusic] = useState<Music[]>([]);
  const [allMusic, setAllMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Generation states
  const [generateForm, setGenerateForm] = useState({
    prompt: 'Jazzy, male, smooth, expressive, soulful',
    modelId: '',
    duration: 30,
    lyrics: ''
  });
  const [models, setModels] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  
  // Audio player states
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Feature modal states
  const [featureModal, setFeatureModal] = useState<{
    isOpen: boolean;
    musicId: string;
    musicTitle: string;
  }>({ isOpen: false, musicId: '', musicTitle: '' });

  // Edit featured music modal states
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    music: Music | null;
  }>({ isOpen: false, music: null });

  const [editForm, setEditForm] = useState({
    tags: '',
    artworkFile: null as File | null,
    uploading: false
  });

  useEffect(() => {
    fetchModels();
    
    if (activeTab === 'my-music') {
      fetchMyMusic();
    } else if (activeTab === 'all-users') {
      fetchAllMusic();
    }
  }, [activeTab]);

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/admin/music/models');
      setModels(response.data.data || []);
      if (response.data.data?.length > 0) {
        setGenerateForm(prev => ({ ...prev, modelId: response.data.data[0]._id }));
      }
    } catch (error) {
      // Failed to fetch models
    }
  };

  const fetchMyMusic = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axios.get('/api/admin/music/my-music');
      setMyMusic(response.data.data || []);
    } catch (error) {
      // Failed to fetch my music
      if (!silent) setError('Failed to load your music');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAllMusic = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/music/mine');
      setAllMusic(response.data.data || []);
    } catch (error) {
      // Failed to fetch all music
      setError('Failed to load music');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setGenerating(true);
    try {
      await axios.post('/api/admin/music/generate', generateForm);
      setActiveTab('my-music');
      
      // Polling system for real-time updates
      const pollForUpdates = () => {
        const interval = setInterval(async () => {
          try {
            // Silent update - no loading state
            await fetchMyMusic(true);
            // Check if all music items are completed or failed
            const response = await axios.get('/api/admin/music/my-music');
            const currentMusic = response.data.data || [];
            const hasProcessing = currentMusic.some((music: Music) => music.status === 'processing');
            
            if (!hasProcessing) {
              clearInterval(interval);
            }
          } catch (error) {
            // Polling error
          }
        }, 3000); // Check every 3 seconds
        
        // Clear after 5 minutes max
        setTimeout(() => clearInterval(interval), 300000);
      };
      
      setTimeout(pollForUpdates, 2000); // Start polling after 2 seconds
    } catch (error: any) {
      // Failed to generate music
      alert(error.response?.data?.message || 'Failed to generate music');
    } finally {
      setGenerating(false);
    }
  };

  const handleFeature = async (musicId: string) => {
    try {
      await axios.post(`/api/admin/music/${musicId}/feature`, {
        category: 'mood',
        subcategory: 'chill',
        order: 0
      });
      
      if (activeTab === 'my-music') {
        fetchMyMusic();
      } else {
        fetchAllMusic();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to feature music');
    }
  };

  // Edit music handlers (both featured and non-featured)
  const handleEditFeatured = (music: Music) => {
    setEditModal({ isOpen: true, music });
    setEditForm({
      tags: music.featured?.tags?.join(', ') || '',
      artworkFile: null,
      uploading: false
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal.music) return;

    try {
      setEditForm(prev => ({ ...prev, uploading: true }));

      // If music is not featured, feature it first
      if (!editModal.music.featured?.isActive) {
        await handleFeature(editModal.music._id);
        // Wait a bit for the feature operation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Upload artwork if selected
      let artworkData = null;
      if (editForm.artworkFile) {
        const formData = new FormData();
        formData.append('artwork', editForm.artworkFile);
        
        const uploadResponse = await axios.post(
          `/api/admin/music/${editModal.music._id}/artwork`, 
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        artworkData = uploadResponse.data.data;
      }

      // Update featured music with tags and artwork
      await axios.put(`/api/admin/featured/${editModal.music._id}`, {
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        ...(artworkData && { artwork: artworkData })
      });

      // Refresh music lists
      if (activeTab === 'my-music') {
        fetchMyMusic();
      } else {
        fetchAllMusic();
      }

      // Close modal
      setEditModal({ isOpen: false, music: null });
      setEditForm({ tags: '', artworkFile: null, uploading: false });

    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update music');
    } finally {
      setEditForm(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleUnfeature = async (musicId: string) => {
    try {
      await axios.delete(`/api/admin/music/${musicId}/feature`);
      
      if (activeTab === 'my-music') {
        fetchMyMusic();
      } else {
        fetchAllMusic();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unfeature music');
    }
  };

  const handleDelete = async (musicId: string) => {
    try {
      await axios.delete(`/api/admin/music/${musicId}`);
      fetchMyMusic(); // Refresh the list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete music');
    }
  };

  const handlePlayPause = (music: Music) => {

    if (playingMusicId === music._id && isPlaying) {
      // Pause current music
      currentAudio?.pause();
      setIsPlaying(false);
    } else if (playingMusicId === music._id && !isPlaying) {
      // Resume current music
      currentAudio?.play();
      setIsPlaying(true);
    } else {
      // Play new music
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      
      // Use direct CDN URL 
      const audioUrl = music.cdnUrl || music.audioUrl;
      
      if (!audioUrl) {
        alert('No audio URL found for this music');
        return;
      }
      
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setPlayingMusicId(null);
        setCurrentAudio(null);
      });
      
      audio.addEventListener('error', (e) => {
        alert('Failed to play audio. The file might be corrupted or unavailable.');
        setIsPlaying(false);
        setPlayingMusicId(null);
        setCurrentAudio(null);
      });
      
      audio.addEventListener('loadstart', () => {
        // Audio loading started
      });
      
      audio.addEventListener('canplay', () => {
        // Audio can play
      });
      
      audio.play()
        .then(() => {
          setCurrentAudio(audio);
          setPlayingMusicId(music._id);
          setIsPlaying(true);
        })
        .catch((error) => {
          alert('Failed to play audio: ' + error.message);
        });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Music Management</h1>
        <p className="mt-2 text-gray-600">Generate, manage and feature music tracks</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎵 Generate Music
          </button>
          <button
            onClick={() => setActiveTab('my-music')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-music'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📚 My Music
          </button>
          <button
            onClick={() => setActiveTab('all-users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all-users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 All Users Music
          </button>
        </nav>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="max-w-2xl">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generate New Music</h2>
            
            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={generateForm.modelId}
                onChange={(e) => setGenerateForm({ ...generateForm, modelId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {models.map((model) => (
                  <option key={model._id} value={model._id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={generateForm.prompt}
                onChange={(e) => setGenerateForm({ ...generateForm, prompt: e.target.value })}
                placeholder="Describe the music you want to generate..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={generateForm.duration}
                onChange={(e) => setGenerateForm({ ...generateForm, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !generateForm.prompt.trim()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Music'}
            </button>
          </div>
        </div>
      )}

      {/* My Music Tab */}
      {activeTab === 'my-music' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : myMusic.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No music generated yet. Go to Generate tab to create music.
            </div>
          ) : (
            <div className="space-y-4">
              {myMusic.map((music) => (
                <div key={music._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  {/* Thumbnail - Ana uygulamadaki gibi */}
                  <div 
                    className="w-16 h-16 rounded-lg relative group cursor-pointer flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{
                      backgroundImage: (music.featured?.isActive && music.featured?.artwork?.cdnUrl)
                        ? `url(${music.featured.artwork.cdnUrl})`
                        : music.artworkUrl 
                          ? `url(${music.artworkUrl})` 
                          : 'linear-gradient(to bottom right, rgb(147 51 234), rgb(219 39 119))',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    onClick={() => {
                      if (music.status === 'completed' && (music.cdnUrl || music.audioUrl)) {
                        handlePlayPause(music);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                      {music.status === 'completed' && (music.cdnUrl || music.audioUrl) ? (
                        // Show play/pause based on current state
                        (() => {
                          if (playingMusicId === music._id && isPlaying) {
                            // Pause icon - always visible when playing
                            return (
                              <svg className="h-6 w-6 text-white opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                              </svg>
                            );
                          } else if (playingMusicId === music._id) {
                            // Play icon - always visible when paused
                            return (
                              <svg className="h-6 w-6 text-white opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            );
                          } else {
                            // Play icon - visible on hover
                            return (
                              <svg className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            );
                          }
                        })()
                      ) : (
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Music Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-base">{music.title}</h3>
                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {music.prompt?.split(',').filter((tag: string) => tag.trim()).slice(0, 3).map((tag: string, tagIndex: number) => (
                        <span 
                          key={tagIndex} 
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                      {music.featured?.isActive && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons + Duration */}
                  <div className="flex items-center gap-3">
                    {/* Duration */}
                    <span className="text-sm text-gray-500 font-mono">
                      {music.duration ? `${Math.floor(music.duration / 60)}:${(music.duration % 60).toString().padStart(2, '0')}` : '01:34'}
                    </span>

                    {music.status === 'completed' && (
                      <>
                        {/* Edit button - always show for completed music */}
                        <button
                          onClick={() => handleEditFeatured(music)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="Edit music"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Feature/Unfeature buttons */}
                        {!music.featured?.isActive ? (
                          <button
                            onClick={() => handleFeature(music._id)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                            title="Feature this music"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnfeature(music._id)}
                            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors text-yellow-600"
                            title="Unfeature this music"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm('Bu müziği silmek istediğinden emin misin?')) {
                              handleDelete(music._id);
                            }
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Delete this music"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </>
                    )}

                    {music.status === 'processing' && (
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Processing...
                      </div>
                    )}

                    {music.status === 'failed' && (
                      <>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                          Failed
                        </span>
                        <button
                          onClick={() => {
                            if (confirm('Bu hatalı müziği silmek istediğinden emin misin?')) {
                              handleDelete(music._id);
                            }
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Delete failed music"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Users Music Tab */}
      {activeTab === 'all-users' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : allMusic.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No user music found.</div>
          ) : (
            <div className="grid gap-4">
              {allMusic.map((music) => (
                <div key={music._id} className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{music.title}</h3>
                      <p className="text-sm text-gray-500">{music.prompt.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-400">
                        By: {music.userId?.name || 'Unknown'} ({music.userId?.email})
                      </p>
                      {music.featured?.isActive && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(music.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Featured Music Modal */}
      {editModal.isOpen && editModal.music && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Featured Music</h2>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">{editModal.music.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{editModal.music.prompt}</p>
              </div>

              {/* Current Artwork Preview */}
              {editModal.music.featured?.artwork?.cdnUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Artwork</label>
                  <div className="w-20 h-20 rounded-lg overflow-hidden">
                    <img 
                      src={editModal.music.featured.artwork.cdnUrl} 
                      alt="Current artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Artwork Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Artwork (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditForm(prev => ({ ...prev, artworkFile: file }));
                  }}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be saved to VeeqAI/Artwork/
                </p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="chill, ambient, relaxing"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModal({ isOpen: false, music: null })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  disabled={editForm.uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editForm.uploading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editForm.uploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}