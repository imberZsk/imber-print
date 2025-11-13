# 3D模型生成Web应用API接口规范

## 1. API概述

### 1.1 基础信息
- **API版本**: v1
- **Base URL**: `https://api.3dgenerator.com/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **编码**: UTF-8

### 1.2 认证机制
所有API请求都需要在Header中包含认证信息：
```http
Authorization: Bearer <jwt_token>
```

### 1.3 通用响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### 1.4 状态码定义
- **200**: 请求成功
- **201**: 资源创建成功
- **400**: 请求参数错误
- **401**: 未认证或认证失败
- **403**: 权限不足
- **404**: 资源不存在
- **429**: 请求频率限制
- **500**: 服务器内部错误

## 2. 认证相关接口

### 2.1 用户注册
**POST** `/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "张三",
  "captchaToken": "captcha_token_from_frontend"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "张三",
      "avatar": null,
      "plan": "free",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "该邮箱已被注册",
    "details": {
      "field": "email",
      "value": "user@example.com"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 2.2 用户登录
**POST** `/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "张三",
      "avatar": "https://cdn.example.com/avatars/user123.jpg",
      "plan": "free",
      "usage": {
        "monthlyGenerations": 3,
        "totalGenerations": 15,
        "maxMonthlyGenerations": 5
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 2.3 Token刷新
**POST** `/auth/refresh`

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 2.4 用户登出
**POST** `/auth/logout`

**请求头**:
```http
Authorization: Bearer <access_token>
```

**响应**:
```json
{
  "success": true,
  "message": "登出成功",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 3. 3D模型生成接口

### 3.1 图像生成3D模型
**POST** `/generate/from-image`

**Content-Type**: `multipart/form-data`

**请求参数**:
```typescript
interface ImageGenerationRequest {
  image: File; // 图像文件 (JPG/PNG/WEBP, max 10MB)
  options: {
    style: 'realistic' | 'cartoon' | 'low-poly' | 'abstract';
    quality: 'standard' | 'high' | 'ultra';
    format: 'glb' | 'gltf';
    textureResolution?: '512' | '1024' | '2048';
    generateTexture?: boolean;
    preserveColors?: boolean;
  };
  webhook?: string; // 可选：完成通知URL
}
```

**请求示例**:
```bash
curl -X POST "https://api.3dgenerator.com/v1/generate/from-image" \
  -H "Authorization: Bearer <jwt_token>" \
  -F "image=@/path/to/image.jpg" \
  -F "options={
    \"style\": \"realistic\",
    \"quality\": \"high\",
    \"format\": \"glb\",
    \"textureResolution\": \"1024\",
    \"generateTexture\": true,
    \"preserveColors\": true
  }"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "estimatedTime": 300,
    "progressUrl": "/api/v1/progress/task_550e8400-e29b-41d4-a716-446655440000",
    "webSocketUrl": "wss://api.3dgenerator.com/v1/ws/progress/task_550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 3.2 文本生成3D模型
**POST** `/generate/from-text`

**请求体**:
```json
{
  "prompt": "一个未来风格的机器人，银色金属外壳，蓝色LED眼睛",
  "negativePrompt": "低质量, 模糊, 扭曲",
  "options": {
    "style": "realistic",
    "quality": "high",
    "format": "glb",
    "textureResolution": "1024",
    "generateTexture": true,
    "seed": 42
  },
  "webhook": "https://your-app.com/webhook/generation-complete"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_660e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "estimatedTime": 240,
    "progressUrl": "/api/v1/progress/task_660e8400-e29b-41d4-a716-446655440000",
    "webSocketUrl": "wss://api.3dgenerator.com/v1/ws/progress/task_660e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 3.3 生成任务状态查询
**GET** `/generate/task/{taskId}`

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "type": "image",
    "status": "completed",
    "progress": 100,
    "input": {
      "type": "image",
      "filename": "input_image.jpg",
      "size": 2048576
    },
    "result": {
      "modelId": "model_770e8400-e29b-41d4-a716-446655440000",
      "modelUrl": "https://cdn.3dgenerator.com/models/model_770e8400-e29b-41d4-a716-446655440000.glb",
      "thumbnailUrl": "https://cdn.3dgenerator.com/thumbnails/model_770e8400-e29b-41d4-a716-446655440000.jpg",
      "metadata": {
        "vertices": 12500,
        "faces": 6200,
        "materials": 3,
        "textures": 2,
        "fileSize": 5242880,
        "boundingBox": {
          "min": [-1.5, -2.0, -1.5],
          "max": [1.5, 2.0, 1.5]
        }
      }
    },
    "timing": {
      "createdAt": "2024-01-15T10:30:00Z",
      "startedAt": "2024-01-15T10:30:05Z",
      "completedAt": "2024-01-15T10:34:30Z",
      "duration": 265
    }
  },
  "timestamp": "2024-01-15T10:34:30Z",
  "requestId": "req_123456789"
}
```

### 3.4 取消生成任务
**POST** `/generate/task/{taskId}/cancel`

**响应**:
```json
{
  "success": true,
  "message": "任务已取消",
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "reason": "用户主动取消"
  },
  "timestamp": "2024-01-15T10:32:00Z",
  "requestId": "req_123456789"
}
```

## 4. 3D模型管理接口

### 4.1 获取用户模型列表
**GET** `/models`

**查询参数**:
```
?page=1&limit=20&sort=createdAt&order=desc&search=机器人&format=glb&status=completed
```

**响应**:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "model_770e8400-e29b-41d4-a716-446655440000",
        "name": "未来机器人",
        "description": "一个科幻风格的机器人模型",
        "thumbnail": "https://cdn.3dgenerator.com/thumbnails/model_770e8400-e29b-41d4-a716-446655440000.jpg",
        "url": "https://cdn.3dgenerator.com/models/model_770e8400-e29b-41d4-a716-446655440000.glb",
        "format": "glb",
        "size": 5242880,
        "metadata": {
          "vertices": 12500,
          "faces": 6200,
          "materials": 3,
          "textures": 2
        },
        "tags": ["机器人", "科幻", "金属"],
        "isPublic": false,
        "shareToken": "share_abc123",
        "viewCount": 42,
        "downloadCount": 15,
        "createdAt": "2024-01-15T10:34:30Z",
        "updatedAt": "2024-01-15T10:34:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req_123456789"
}
```

### 4.2 获取模型详情
**GET** `/models/{modelId}`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "model_770e8400-e29b-41d4-a716-446655440000",
    "name": "未来机器人",
    "description": "一个科幻风格的机器人模型",
    "thumbnail": "https://cdn.3dgenerator.com/thumbnails/model_770e8400-e29b-41d4-a716-446655440000.jpg",
    "url": "https://cdn.3dgenerator.com/models/model_770e8400-e29b-41d4-a716-446655440000.glb",
    "format": "glb",
    "size": 5242880,
    "metadata": {
      "vertices": 12500,
      "faces": 6200,
      "materials": 3,
      "textures": 2,
      "boundingBox": {
        "min": [-1.5, -2.0, -1.5],
        "max": [1.5, 2.0, 1.5]
      },
      "center": [0, 0, 0],
      "dimensions": [3.0, 4.0, 3.0]
    },
    "tags": ["机器人", "科幻", "金属"],
    "isPublic": false,
    "shareToken": "share_abc123",
    "viewCount": 42,
    "downloadCount": 15,
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:34:30Z",
    "updatedAt": "2024-01-15T10:34:30Z"
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req_123456789"
}
```

### 4.3 更新模型信息
**PUT** `/models/{modelId}`

**请求体**:
```json
{
  "name": "更新后的模型名称",
  "description": "更新后的描述",
  "tags": ["新标签1", "新标签2"],
  "isPublic": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "model_770e8400-e29b-41d4-a716-446655440000",
    "name": "更新后的模型名称",
    "description": "更新后的描述",
    "tags": ["新标签1", "新标签2"],
    "isPublic": true,
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "timestamp": "2024-01-15T11:00:00Z",
  "requestId": "req_123456789"
}
```

### 4.4 删除模型
**DELETE** `/models/{modelId}`

**响应**:
```json
{
  "success": true,
  "message": "模型已删除",
  "data": {
    "id": "model_770e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2024-01-15T11:05:00Z"
  },
  "timestamp": "2024-01-15T11:05:00Z",
  "requestId": "req_123456789"
}
```

### 4.5 下载模型
**GET** `/models/{modelId}/download`

**查询参数**:
```
?format=original|gltf|obj&quality=high|medium|low
```

**响应**: Binary file with headers
```http
Content-Type: model/gltf-binary
Content-Disposition: attachment; filename="model_770e8400-e29b-41d4-a716-446655440000.glb"
Content-Length: 5242880
X-Model-Id: model_770e8400-e29b-41d4-a716-446655440000
```

### 4.6 分享模型
**POST** `/models/{modelId}/share`

**请求体**:
```json
{
  "expiresIn": 604800, // 7 days in seconds
  "password": "optional_password", // optional
  "maxDownloads": 10 // optional, 0 = unlimited
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "shareToken": "share_xyz789",
    "shareUrl": "https://3dgenerator.com/share/xyz789",
    "qrCode": "https://cdn.3dgenerator.com/qr/share_xyz789.png",
    "embedCode": "<iframe src='https://3dgenerator.com/embed/xyz789' width='800' height='600'></iframe>",
    "expiresAt": "2024-01-22T11:10:00Z",
    "stats": {
      "viewCount": 0,
      "downloadCount": 0
    }
  },
  "timestamp": "2024-01-15T11:10:00Z",
  "requestId": "req_123456789"
}
```

## 5. 用户管理接口

### 5.1 获取用户信息
**GET** `/user/profile`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "张三",
    "avatar": "https://cdn.3dgenerator.com/avatars/user123.jpg",
    "plan": {
      "type": "free",
      "expiresAt": null,
      "features": ["basic_generation", "standard_quality", "community_support"]
    },
    "usage": {
      "monthlyGenerations": 3,
      "maxMonthlyGenerations": 5,
      "totalGenerations": 15,
      "storageUsed": 15728640, // bytes
      "maxStorage": 104857600, // 100MB
      "lastGenerationAt": "2024-01-14T15:30:00Z"
    },
    "preferences": {
      "language": "zh-CN",
      "theme": "light",
      "notifications": {
        "email": true,
        "push": false,
        "marketing": false
      },
      "defaultOptions": {
        "style": "realistic",
        "quality": "standard",
        "format": "glb"
      }
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T11:15:00Z",
  "requestId": "req_123456789"
}
```

### 5.2 更新用户信息
**PUT** `/user/profile`

**请求体**:
```json
{
  "name": "张小明",
  "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "preferences": {
    "language": "zh-CN",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "marketing": false
    }
  }
}
```

### 5.3 修改密码
**POST** `/user/change-password`

**请求体**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

### 5.4 获取用户统计
**GET** `/user/stats`

**响应**:
```json
{
  "success": true,
  "data": {
    "generationStats": {
      "total": 15,
      "successRate": 0.93,
      "averageTime": 245, // seconds
      "byType": {
        "image": 10,
        "text": 5
      },
      "byStyle": {
        "realistic": 8,
        "cartoon": 4,
        "low-poly": 3
      }
    },
    "modelStats": {
      "total": 12,
      "public": 2,
      "totalViews": 156,
      "totalDownloads": 42
    },
    "recentActivity": [
      {
        "type": "generation_completed",
        "description": "成功生成机器人模型",
        "timestamp": "2024-01-15T10:34:30Z"
      }
    ]
  },
  "timestamp": "2024-01-15T11:20:00Z",
  "requestId": "req_123456789"
}
```

## 6. WebSocket接口

### 6.1 进度更新连接
**连接URL**: `wss://api.3dgenerator.com/v1/ws/progress/{taskId}`

**连接参数**:
```
?token=<jwt_token>&clientId=<client_id>
```

**消息格式**:
```typescript
interface WebSocketMessage {
  type: 'progress_update' | 'status_change' | 'error' | 'complete' | 'pong';
  timestamp: number;
  data: any;
}
```

**进度更新消息**:
```json
{
  "type": "progress_update",
  "timestamp": 1705319070000,
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "progress": 45,
    "status": "processing",
    "message": "正在处理图像...",
    "estimatedTimeRemaining": 180,
    "details": {
      "currentStep": "mesh_generation",
      "stepProgress": 60
    }
  }
}
```

**状态变更消息**:
```json
{
  "type": "status_change",
  "timestamp": 1705319100000,
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "oldStatus": "processing",
    "newStatus": "completed",
    "message": "3D模型生成完成"
  }
}
```

**完成消息**:
```json
{
  "type": "complete",
  "timestamp": 1705319100000,
  "data": {
    "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
    "modelId": "model_770e8400-e29b-41d4-a716-446655440000",
    "modelUrl": "https://cdn.3dgenerator.com/models/model_770e8400-e29b-41d4-a716-446655440000.glb",
    "thumbnailUrl": "https://cdn.3dgenerator.com/thumbnails/model_770e8400-e29b-41d4-a716-446655440000.jpg",
    "metadata": {
      "vertices": 12500,
      "faces": 6200,
      "materials": 3,
      "fileSize": 5242880
    }
  }
}
```

## 7. 错误处理

### 7.1 错误码定义

| 错误码 | HTTP状态 | 描述 |
|--------|----------|------|
| INVALID_REQUEST | 400 | 请求参数无效 |
| MISSING_PARAMETER | 400 | 缺少必需参数 |
| INVALID_FILE_TYPE | 400 | 文件类型不支持 |
| FILE_TOO_LARGE | 400 | 文件过大 |
| UNAUTHORIZED | 401 | 未认证或认证失败 |
| TOKEN_EXPIRED | 401 | Token已过期 |
| INSUFFICIENT_PERMISSIONS | 403 | 权限不足 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| GENERATION_FAILED | 500 | 3D模型生成失败 |
| AI_SERVICE_ERROR | 502 | AI服务异常 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 7.2 错误响应示例
```json
{
  "success": false,
  "error": {
    "code": "GENERATION_FAILED",
    "message": "3D模型生成失败，请稍后重试",
    "details": {
      "taskId": "task_550e8400-e29b-41d4-a716-446655440000",
      "reason": "AI_SERVICE_TIMEOUT",
      "retryAfter": 60
    }
  },
  "timestamp": "2024-01-15T11:25:00Z",
  "requestId": "req_123456789"
}
```

## 8. 限流规则

### 8.1 认证相关限流
- **注册**: 每小时5次/IP
- **登录**: 每小时20次/IP，失败5次后锁定15分钟
- **Token刷新**: 每小时50次/用户

### 8.2 生成相关限流
- **免费用户**: 每小时2次，每天5次，每月20次
- **专业用户**: 每小时10次，每天50次，每月500次
- **企业用户**: 每小时50次，每天300次，每月3000次

### 8.3 其他接口限流
- **模型查询**: 每小时100次/用户
- **文件下载**: 每小时20次/用户
- **WebSocket连接**: 每用户最多3个并发连接

## 9. 文件上传规范

### 9.1 支持的文件格式
**图像文件**:
- JPEG: `.jpg`, `.jpeg` (最大10MB)
- PNG: `.png` (最大10MB)
- WebP: `.webp` (最大10MB)

**3D模型文件**:
- GLB: `.glb` (最大50MB)
- GLTF: `.gltf` (最大50MB)

### 9.2 文件验证规则
- **文件类型**: 通过文件头和MIME类型双重验证
- **文件大小**: 严格限制最大文件大小
- **图像尺寸**: 建议最小512x512像素，最大4096x4096像素
- **病毒扫描**: 所有上传文件都会进行病毒扫描

### 9.3 上传最佳实践
- **分片上传**: 支持大文件分片上传，每片5MB
- **断点续传**: 支持上传中断后恢复
- **并行上传**: 支持多个文件同时上传
- **进度回调**: 提供上传进度实时回调

这个API规范文档为3D模型生成Web应用提供了完整的接口定义，包括认证、生成、管理和实时通信等所有核心功能，为前后端开发提供了清晰的技术指导。