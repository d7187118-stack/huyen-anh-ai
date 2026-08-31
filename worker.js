export default {
  async fetch(request, env) {
    // Cho phép web GitHub Pages gọi Worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Trình duyệt gửi OPTIONS trước khi POST
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Chỉ cho phép POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Chỉ hỗ trợ POST",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      // Lấy prompt từ web
      const body = await request.json();
      const prompt = body.prompt;

      if (!prompt || typeof prompt !== "string") {
        return new Response(
          JSON.stringify({
            error: "Vui lòng nhập prompt",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Kiểm tra API key
      if (!env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: "Chưa cấu hình OPENAI_API_KEY trong Cloudflare",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Gọi OpenAI Image API
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: prompt,
            size: "1024x1024"
          }),
        }
      );

      const data = await response.json();

      // Nếu API báo lỗi
      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data?.error?.message || "Lỗi khi tạo ảnh",
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // GPT Image trả ảnh dạng base64
      const imageBase64 = data?.data?.[0]?.b64_json;

      if (!imageBase64) {
        return new Response(
          JSON.stringify({
            error: "AI không trả về ảnh",
            data: data,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Trả ảnh về web
      return new Response(
        JSON.stringify({
          success: true,
          image: `data:image/png;base64,${imageBase64}`,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message || "Worker gặp lỗi",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  }
};
