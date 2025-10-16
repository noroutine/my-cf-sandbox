import { getSandbox, proxyToSandbox, type Sandbox } from "@cloudflare/sandbox";

export { Sandbox } from "@cloudflare/sandbox";

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Required for preview URLs (if you expose ports later)
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;

    const url = new URL(request.url);

    // Get or create a sandbox instance
    const sandbox = getSandbox(env.Sandbox, "my-sandbox");

    // Execute Python code
    if (url.pathname === "/run") {
      const result = await sandbox.exec('python3 -c "print(3 + 3)"');
      return Response.json({
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
      });
    }

    // Work with files
    if (url.pathname === "/file") {
      await sandbox.writeFile("/workspace/hello.txt", "Hello, CF Sandbox!");
      const file = await sandbox.readFile("/workspace/hello.txt");
      return Response.json({
        content: file.content,
      });
    }

    return new Response("Try /run or /file");
  },
};
