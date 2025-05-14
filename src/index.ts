import { createSchema, createYoga } from 'graphql-yoga';
import { KVNamespace } from '@cloudflare/workers-types';

declare global {
  const MY_LIST_KV: KVNamespace;
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

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
    getItems: async (): Promise<Item[]> => {
      console.log('开始获取 items...');
      try {
        // 动态检查 MY_LIST_KV 是否存在
        const MY_LIST_KV = (globalThis as any).MY_LIST_KV as KVNamespace | undefined;
        if (!MY_LIST_KV) {
          throw new Error('MY_LIST_KV 未定义，请检查 wrangler.toml 配置或仪表板绑定');
        }
        const rawItems = await MY_LIST_KV.get('items', { type: 'json' });
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
    addItem: async (_: unknown, { text }: { text: string }): Promise<Item> => {
      try {
        const MY_LIST_KV = (globalThis as any).MY_LIST_KV as KVNamespace | undefined;
        if (!MY_LIST_KV) {
          throw new Error('MY_LIST_KV 未定义，请检查 wrangler.toml 配置或仪表板绑定');
        }
        const items: Item[] = (await MY_LIST_KV.get('items', { type: 'json' })) || [];
        const newItem: Item = { id: Date.now().toString(), text };
        items.push(newItem);
        await MY_LIST_KV.put('items', JSON.stringify(items));
        return newItem;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('添加 item 失败:', error);
        throw new Error(`无法添加列表项: ${errorMessage}`);
      }
    },
  },
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/graphql',
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  },
});

export default {
  fetch: yoga.fetch,
};