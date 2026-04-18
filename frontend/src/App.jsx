import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [pageId, setPageId] = useState('');
  const [pageInfo, setPageInfo] = useState(null);
  const [insights, setInsights] = useState(null);
  const [posts, setPosts] = useState([]);
  
  const [newPostText, setNewPostText] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // State mới cho hình ảnh
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States cho chi tiết bài viết (Comments & Likes)
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likesSummary, setLikesSummary] = useState(null);

  // 1. Tải toàn bộ dữ liệu cơ bản của Page
  const loadPageData = async () => {
    if (!pageId) {
      setError('Vui lòng nhập Page ID');
      return;
    }
    setLoading(true);
    setError('');
    setPageInfo(null);
    setPosts([]);
    setInsights(null);
    setActivePost(null);

    try {
      const infoRes = await axios.get(`${API_BASE_URL}/page/${pageId}`);
      setPageInfo(infoRes.data);

      const postsRes = await axios.get(`${API_BASE_URL}/page/${pageId}/posts`);
      setPosts(postsRes.data.data || []);

      const insightsRes = await axios.get(`${API_BASE_URL}/page/${pageId}/insights`);
      setInsights(insightsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Có lỗi xảy ra khi tải dữ liệu. Hãy kiểm tra lại Page ID hoặc Token.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Đăng bài mới (Cập nhật để gửi thêm imageUrl)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText && !imageUrl) return; // Cho phép đăng chỉ có ảnh hoặc chỉ có text
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/page/${pageId}/posts`, { 
        message: newPostText,
        imageUrl: imageUrl 
      });
      setNewPostText('');
      setImageUrl(''); // Reset ô nhập ảnh
      alert('Đăng bài thành công!');
      
      const postsRes = await axios.get(`${API_BASE_URL}/page/${pageId}/posts`);
      setPosts(postsRes.data.data || []);
    } catch (err) {
      alert('Lỗi đăng bài: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 3. Xóa bài viết
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/page/post/${postId}`);
      alert('Đã xóa bài viết!');
      setPosts(posts.filter(p => p.id !== postId));
      if (activePost?.id === postId) setActivePost(null);
    } catch (err) {
      alert('Lỗi xóa bài: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 4. Xem chi tiết bài viết (Lấy Likes và Comments)
  const viewPostDetails = async (post) => {
    setActivePost(post);
    setComments([]);
    setLikesSummary(null);
    try {
      const [commentsRes, likesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/page/post/${post.id}/comments`),
        axios.get(`${API_BASE_URL}/page/post/${post.id}/likes`)
      ]);
      setComments(commentsRes.data.data || []);
      setLikesSummary(likesRes.data.summary?.total_count || 0);
    } catch (err) {
      console.error('Lỗi lấy chi tiết bài viết:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Facebook Page Manager</h1>
            <p className="text-gray-500 text-sm">Quản lý Page qua Graph API</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input 
              type="text" 
              placeholder="Nhập Page ID..." 
              className="border p-2 rounded-lg flex-1 md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
            <button 
              onClick={loadPageData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              {loading ? 'Đang tải...' : 'Tải dữ liệu'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
            {error}
          </div>
        )}

        {pageInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột 1: Thông tin, Insights & Form đăng bài */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-500">
                <h2 className="text-lg font-bold mb-3">{pageInfo.name}</h2>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>ID:</strong> {pageInfo.id}</p>
                  <p><strong>Người theo dõi:</strong> {pageInfo.followers_count?.toLocaleString() || 0}</p>
                  <p><strong>Lượt thích trang:</strong> {pageInfo.fan_count?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Thẻ Đăng bài ĐÃ CẬP NHẬT */}
              <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-green-500">
                <h3 className="font-bold mb-3">Tạo bài viết mới</h3>
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Bạn đang nghĩ gì?"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  ></textarea>
                  
                  {/* Ô nhập Link Ảnh */}
                  <input
                    type="url"
                    placeholder="Nhập đường link ảnh (URL) - Tùy chọn"
                    className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  
                  {/* Preview ảnh nếu có link */}
                  {imageUrl && (
                    <div className="mt-2 relative">
                       <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => e.target.style.display = 'none'} // Ẩn nếu link lỗi
                       />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || (!newPostText && !imageUrl)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng lên Page'}
                  </button>
                </form>
              </div>

              {insights && insights.length > 0 && (
                <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-purple-500">
                  <h3 className="font-bold mb-3">Insights Trang</h3>
                  <div className="space-y-3">
                    {insights.map(metric => (
                      <div key={metric.name} className="bg-gray-50 p-3 rounded border">
                        <p className="text-xs font-semibold text-gray-500 uppercase">{metric.title || metric.name}</p>
                        <p className="text-xl font-bold text-gray-800">
                          {metric.values?.[0]?.value || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cột 2: Danh sách Post ĐÃ CẬP NHẬT ĐỂ HIỆN ẢNH */}
            <div className="bg-white p-5 rounded-xl shadow-md lg:col-span-1 h-[700px] overflow-y-auto">
              <h3 className="font-bold mb-4 sticky top-0 bg-white py-2 border-b">Danh sách bài viết ({posts.length})</h3>
              {posts.length === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có bài viết nào.</p>
              ) : (
                <ul className="space-y-4">
                  {posts.map(post => (
                    <li key={post.id} className={`p-4 border rounded-lg hover:shadow-md transition flex flex-col justify-between ${activePost?.id === post.id ? 'ring-2 ring-blue-400' : ''}`}>
                      <div>
                        {post.message && <p className="text-sm text-gray-800 mb-2">{post.message}</p>}
                        
                        {/* Render hình ảnh nếu bài viết có ảnh */}
                        {post.full_picture && (
                          <img 
                            src={post.full_picture} 
                            alt="Post Media" 
                            className="w-full rounded-md object-contain mb-3 border max-h-48"
                          />
                        )}
                        {!post.message && !post.full_picture && (
                          <p className="text-sm text-gray-400 italic mb-2">[Bài viết không có nội dung hỗ trợ]</p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 mb-3">{new Date(post.created_time).toLocaleString()}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => viewPostDetails(post)}
                            className="text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded w-full"
                          >
                            Tương tác
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded w-full"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cột 3: Chi tiết tương tác */}
            <div className="bg-white p-5 rounded-xl shadow-md lg:col-span-1 h-[700px] overflow-y-auto">
              {activePost ? (
                <div>
                  <h3 className="font-bold mb-4 sticky top-0 bg-white py-2 border-b">Tương tác bài viết</h3>
                  
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-800">Tổng lượt thích:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {likesSummary !== null ? likesSummary : '...'} 👍
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm mb-3">Bình luận ({comments.length})</h4>
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có bình luận nào.</p>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map(cmt => (
                        <li key={cmt.id} className="bg-gray-50 p-3 rounded-lg border text-sm">
                          <p className="font-semibold text-gray-700">{cmt.from?.name || 'Ẩn danh'}</p>
                          <p className="text-gray-600">{cmt.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">
                  Chọn "Tương tác" ở một bài viết<br/>để xem bình luận và lượt thích.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}