import { createSchema, createYoga } from 'graphql-yoga';
import { KVNamespace } from '@cloudflare/workers-types';

declare global {
  const MY_LIST_KV: KVNamespace;
}
// 定义 TypeScript 类型
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
    hello: () => 'Hello World!', // 保留 hello 查询
    getItems: async (): Promise<Item[]> => {
    console.log('开始获取 items...');
    return [{ id: '1', text: '测试项' }]; // 直接返回硬编码数据
    },
  },
  Mutation: {
    addItem: async (_: unknown, { text }: { text: string }) : Promise<Item> =>{
      const items: Item[] = await MY_LIST_KV.get('items', { type: 'json' }) || [];
      const newItem = { id: Date.now().toString(), text };
      items.push(newItem);
      await MY_LIST_KV.put('items', JSON.stringify(items));
      return newItem;
    },
  },
};
const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/graphql',
});

export default {
  fetch: yoga.fetch
};