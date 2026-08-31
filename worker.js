const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {

  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname === "/generate"
    ) {

      try {

        const body = await request.json();

        const prompt = body.prompt?.trim();

        if (!prompt) {
          return Response.json(
            {
              error: "Prompt không được để trống"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        if (!env.OPENAI_API_KEY) {
          return Response.json(
            {
              error: "Chưa cấu hình OPENAI_API_KEY"
            },
            {
              status: 500,
              headers: corsHeaders
            }
          );
        }

        const openaiResponse = await fetch(
          "https://api.openai.com/v1/images/generations",
          {

            method: "POST",

            headers: {
              "Authorization":
                `Bearer ${env.OPENAI_API_KEY}`,

              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              model: "gpt-image-1",

              prompt: prompt,

              size: "1024x1024"

            })

          }
        );

        const result =
          await openaiResponse.json();

        if (!openaiResponse.ok) {

          return Response.json(
            {
              error:
                result.error?.message ||
                "OpenAI API báo lỗi"
            },
            {
              status: openaiResponse.status,
              headers: corsHeaders
            }
          );

        }

        const imageBase64 =
          result.data?.[0]?.b64_json;

        if (!imageBase64) {

          return Response.json(
            {
              error:
                "Không nhận được dữ liệu ảnh"
            },
            {
              status: 500,
              headers: corsHeaders
            }
          );

        }

        return Response.json(
          {

            image:
              `data:image/png;base64,${imageBase64}`

          },
          {
            headers: corsHeaders
          }
        );

      } catch (error) {

        return Response.json(
          {
            error:
              error.message ||
              "Lỗi máy chủ"
          },
          {
            status: 500,
            headers: corsHeaders
          }
        );

      }

    }

    return Response.json(
      {
        message: "Huyền Ảnh AI Worker đang hoạt động"
      },
      {
        headers: corsHeaders
      }
    );

  }

};
