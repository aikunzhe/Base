export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname || "/";

    // 纯静态站：只允许 GET/HEAD
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 1) 根路径强制返回 /index.html
    if (path === "/" || path === "") {
      const indexUrl = new URL("/index.html", url.origin);
      const indexReq = new Request(indexUrl.toString(), request);
      return env.ASSETS.fetch(indexReq);
    }

    // 2) 其他资源全部交给 ASSETS
    const resp = await env.ASSETS.fetch(request);

    // 3) （可选但推荐）SPA history 路由：当路径不像文件且 404 时，回退 index.html
    // - 例如 /user/123 这种没有后缀的路由
    if (resp.status === 404 && !path.includes(".")) {
      const indexUrl = new URL("/index.html", url.origin);
      const indexReq = new Request(indexUrl.toString(), request);
      return env.ASSETS.fetch(indexReq);
    }

    return resp;
  },
};
