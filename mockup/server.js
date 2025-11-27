const express = require("express");
const { createMockMiddleware } = require("openapi-mock-express-middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("../swagger/swagger.json"); // Swagger 스펙 로드

const app = express();

// Mock API 엔드포인트 (Swagger 스펙 기반)
// createMockMiddleware 내부에서 body-parser를 사용하므로 별도 express.json()을 앞에 두지 않는다.
app.use("/api", createMockMiddleware({ spec: "../swagger/swagger.json" }));

// Swagger UI 문서
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// 루트 경로
app.get("/", (req, res) => {
  res.json({
    message: "Python Judge Mock API Server",
    endpoints: {
      api: "http://localhost:3000/api",
      docs: "http://localhost:3000/docs"
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock API Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
  console.log(`Mock API available at http://localhost:${PORT}/api`);
});
