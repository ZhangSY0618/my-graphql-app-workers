import { createSchema, createYoga, YogaInitialContext } from 'graphql-yoga';
import { GraphQLSchema } from 'graphql';
import { KVNamespace, ExecutionContext } from '@cloudflare/workers-types';

interface Env {
  MY_LIST_KV: KVNamespace;
}

interface Item {
  id: string;
  text: string;
}

const typeDefs = /* GraphQL */ `
  type Item {
    id: ID!
    text: String!
  }

  type Query {
    hello: String!
    getItems: [Item!]!
  }

  type Mutation {
    addItem(text: String!): Item!
  }
`;

interface CustomContext {
  env: Env;
}

interface ServerContext {
  env: Env;
}

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
    getItems: async (_: unknown, __: unknown, context: CustomContext): Promise<Item[]> => {
      console.log('开始获取 items...', context.env);
      try {
        const env = context.env || {};
        if (!env.MY_LIST_KV) {
          throw new Error('MY_LIST_KV 未定义，请检查 wrangler.toml 配置或仪表板绑定');
        }
        const rawItems = await env.MY_LIST_KV.get('items', { type: 'json' });
        console.log('从 KV 获取的原始数据:', rawItems);
        if (!rawItems || !Array.isArray(rawItems)) {
          console.log('数据无效或为空，返回空数组');
          return [];
        }
        const items: Item[] = rawItems.filter((item: any) => 
          typeof item === 'object' && 
          typeof item.id === 'string' && 
          typeof item.text === 'string'
        );
        console.log('过滤后的 items:', items);
        return items;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('获取 items 失败:', error);
        throw new Error(`无法获取列表项: ${errorMessage}`);
      }
    },
  },
  Mutation: {
    addItem: async (_: unknown, { text }: { text: string }, context: CustomContext): Promise<Item> => {
      try {
        const env = context.env || {};
        if (!env.MY_LIST_KV) {
          throw new Error('MY_LIST_KV 未定义，请检查 wrangler.toml 配置或仪表板绑定');
        }
        const items: Item[] = (await env.MY_LIST_KV.get('items', { type: 'json' })) || [];
        const newItem: Item = { id: Date.now().toString(), text };
        items.push(newItem);
        await env.MY_LIST_KV.put('items', JSON.stringify(items));
        return newItem;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('添加 item 失败:', error);
        throw new Error(`无法添加列表项: ${errorMessage}`);
      }
    },
  },
};

const schema: GraphQLSchema = createSchema({ typeDefs, resolvers });

const yoga = createYoga<CustomContext, ServerContext>({
  schema,
  graphqlEndpoint: '/graphql',
  context: (initialContext: YogaInitialContext & ServerContext) => ({
    env: initialContext.env || ({} as Env),
  }),
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  },
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    // 提取 RequestInit 兼容的选项
    const requestInit: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: request.body,
    };
    const serverContext: ServerContext = { env };
    // 第二个参数是 RequestInit，第三个参数是自定义上下文
    return yoga.fetch(url, requestInit, serverContext);
  },
};