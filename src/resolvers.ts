// KV 命名空间在 wrangler.toml 中绑定，名称为 TODOS
export const resolvers = {
  Query: {
    todos: async (_, __, { env }) => {
      const todos = await env.TODOS.get('todos', { type: 'json' });
      return todos || [];
    },
    test: () => 'Hello zhang test!',
  },
  Mutation: {
    createTodo: async (_, { title }, { env }) => {
      const todos = (await env.TODOS.get('todos', { type: 'json' })) || [];
      const todo = {
        id: Math.random().toString(36).slice(2),
        title,
        completed: false,
      };
      todos.push(todo);
      await env.TODOS.put('todos', JSON.stringify(todos));
      return todo;
    },
    updateTodo: async (_, { id, title, completed }, { env }) => {
      const todos = (await env.TODOS.get('todos', { type: 'json' })) || [];
      const todo = todos.find((t) => t.id === id);
      if (!todo) return null;
      if (title !== undefined) todo.title = title;
      if (completed !== undefined) todo.completed = completed;
      await env.TODOS.put('todos', JSON.stringify(todos));
      return todo;
    },
    deleteTodo: async (_, { id }, { env }) => {
      const todos = (await env.TODOS.get('todos', { type: 'json' })) || [];
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) return false;
      todos.splice(index, 1);
      await env.TODOS.put('todos', JSON.stringify(todos));
      return true;
    },
  },
};