export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname || "/";

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 根路径返回 index.html
    if (path === "/" || path === "") {
      const indexUrl = new URL("/index.html", url.origin);
      const indexReq = new Request(indexUrl.toString(), request);
      const indexResp = await env.ASSETS.fetch(indexReq);

      // HTML 文件短缓存，避免 SPA 页面更新看不到最新内容
      const headers = new Headers(indexResp.headers);
      headers.set("Cache-Control", "no-cache");
      return new Response(indexResp.body, { ...indexResp, headers });
    }

    // 其他资源
    const resp = await env.ASSETS.fetch(request);

    // 如果不是文件且 404，回退 index.html（SPA 路由）
    if (resp.status === 404 && !path.includes(".")) {
      const indexUrl = new URL("/index.html", url.origin);
      const indexReq = new Request(indexUrl.toString(), request);
      const indexResp = await env.ASSETS.fetch(indexReq);
      const headers = new Headers(indexResp.headers);
      headers.set("Cache-Control", "no-cache");
      return new Response(indexResp.body, { ...indexResp, headers });
    }

    // 静态资源长缓存
    const headers = new Headers(resp.headers);
    if (path.match(/\.(jpg|jpeg|png|gif|svg|css|js)$/i)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      headers.set("Cache-Control", "no-cache"); // 其他文件短缓存
    }

    return new Response(resp.body, { ...resp, headers });
  },
};
