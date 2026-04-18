require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

const FB_API = process.env.FACEBOOK_GRAPH_URL;
const TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PORT = process.env.PORT || 5000;

// ==========================================
// CẤU HÌNH SWAGGER DẠNG ĐỐI TƯỢNG (KHÔNG SỢ LỖI SPACE)
// ==========================================
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Facebook Page Manager API',
        version: '1.0.0',
        description: 'Tài liệu API dùng để tương tác với Facebook Graph API',
    },
    servers: [
        { url: `http://localhost:${PORT}` }
    ],
    paths: {
        "/api/page/{pageId}": {
            get: {
                summary: "Lấy thông tin cơ bản của Page",
                tags: ["1. Page Info"],
                parameters: [{ in: "path", name: "pageId", required: true, schema: { type: "string" }, description: "Nhập ID Trang" }],
                responses: { 200: { description: "Thành công" } }
            }
        },
        "/api/page/{pageId}/posts": {
            get: {
                summary: "Lấy danh sách bài viết",
                tags: ["2. Posts"],
                parameters: [{ in: "path", name: "pageId", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Thành công" } }
            },
            post: {
                summary: "Đăng bài viết mới",
                tags: ["2. Posts"],
                parameters: [{ in: "path", name: "pageId", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", properties: { message: { type: "string", example: "Xin chào từ Swagger!" } } }
                        }
                    }
                },
                responses: { 200: { description: "Đăng bài thành công" } }
            }
        },
        "/api/page/post/{postId}": {
            delete: {
                summary: "Xóa bài viết",
                tags: ["2. Posts"],
                parameters: [{ in: "path", name: "postId", required: true, schema: { type: "string" }, description: "Nhập ID Bài viết" }],
                responses: { 200: { description: "Xóa thành công" } }
            }
        },
        "/api/page/post/{postId}/comments": {
            get: {
                summary: "Lấy danh sách bình luận",
                tags: ["3. Interactions"],
                parameters: [{ in: "path", name: "postId", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Thành công" } }
            }
        },
        "/api/page/post/{postId}/likes": {
            get: {
                summary: "Lấy tổng lượt thích",
                tags: ["3. Interactions"],
                parameters: [{ in: "path", name: "postId", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Thành công" } }
            }
        },
        "/api/page/{pageId}/insights": {
            get: {
                summary: "Lấy thống kê Page (Insights)",
                tags: ["1. Page Info"],
                parameters: [{ in: "path", name: "pageId", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Thành công" } }
            }
        }
    }
};

// Khởi chạy giao diện Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ==========================================
// CÁC ROUTE API (Xử lý Logic)
// ==========================================
app.get('/api/page/:pageId', async (req, res) => {
    try {
        const response = await axios.get(`${FB_API}/${req.params.pageId}`, {
            params: { access_token: TOKEN, fields: 'id,name,followers_count,fan_count' }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.response?.data || error.message }); }
});

// 2. Lấy danh sách Posts của Page
app.get('/api/page/:pageId/posts', async (req, res) => {
    try {
        const response = await axios.get(`${FB_API}/${req.params.pageId}/posts`, {
            // Thêm full_picture vào fields
            params: { access_token: TOKEN, fields: 'id,message,created_time,full_picture' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// 3. Đăng bài mới lên Page (Hỗ trợ Text & Hình ảnh)
app.post('/api/page/:pageId/posts', async (req, res) => {
    const { message, imageUrl } = req.body;
    try {
        let response;
        if (imageUrl) {
            // Nếu có link ảnh -> Gọi endpoint /photos
            response = await axios.post(`${FB_API}/${req.params.pageId}/photos`, null, {
                params: { message: message, url: imageUrl, access_token: TOKEN }
            });
        } else {
            // Nếu không có ảnh -> Gọi endpoint /feed như cũ
            response = await axios.post(`${FB_API}/${req.params.pageId}/feed`, null, {
                params: { message: message, access_token: TOKEN }
            });
        }
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.delete('/api/page/post/:postId', async (req, res) => {
    try {
        const response = await axios.delete(`${FB_API}/${req.params.postId}`, {
            params: { access_token: TOKEN }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.response?.data || error.message }); }
});

app.get('/api/page/post/:postId/comments', async (req, res) => {
    try {
        const response = await axios.get(`${FB_API}/${req.params.postId}/comments`, {
            params: { access_token: TOKEN }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.response?.data || error.message }); }
});

app.get('/api/page/post/:postId/likes', async (req, res) => {
    try {
        const response = await axios.get(`${FB_API}/${req.params.postId}/likes`, {
            params: { access_token: TOKEN, summary: true }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.response?.data || error.message }); }
});

app.get('/api/page/:pageId/insights', async (req, res) => {
    try {
        const response = await axios.get(`${FB_API}/${req.params.pageId}/insights`, {
            params: { metric: 'page_impressions,page_engaged_users', access_token: TOKEN }
        });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.response?.data || error.message }); }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Tài liệu Swagger API tại http://localhost:${PORT}/api-docs`);
});