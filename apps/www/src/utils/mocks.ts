/**
 * Please generate mock array of message objects representing a conversation between a user and an llm. it should:
 *
 * - be between 10 and 20 messages in length
 * - vary the message content lengths to simulate a natural conversation, and don't make any of the messages too long (like longer than a few paragraphs)
 * - only need role (user or assistant), content, and timestamp properties for each message
 * - set the start to march 10th 2025 at 8pm, and add some time to the timestamp for each messages, simulating what a real convo might have been like
 * - the conversation topic: make this a conversation one where the user is working with the llm to query data from their stripe account and their postgres database (the llm is able to use those tools) to ask questions and perform actions related to their b2b saas business
 * - don't use too many exclamation points or be too enthusiastic / verbose. be professional
 */
export const generateMockConversation = (): {
  name: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[];
} => {
  const start = new Date('2025-03-10T20:00:00');
  return {
    name: 'B2B SaaS Metrics Analysis',
    messages: [
      {
        role: 'user',
        content: 'I need to check our revenue for the last quarter. Can you help me query our Stripe account?',
        timestamp: new Date(start.getTime()),
      },
      {
        role: 'assistant',
        content:
          'I can help you query your Stripe account for revenue data. Would you like to see the total revenue or would you prefer a breakdown by month for the last quarter?',
        timestamp: new Date(start.getTime() + 1 * 60000),
      },
      {
        role: 'user',
        content: "Let's see the breakdown by month please.",
        timestamp: new Date(start.getTime() + 3 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I'll query your Stripe account for monthly revenue in the last quarter.\n\n```sql\nSELECT DATE_TRUNC('month', created) as month, SUM(amount)/100 as revenue\nFROM charges\nWHERE status = 'succeeded' AND created >= NOW() - INTERVAL '3 months'\nGROUP BY month\nORDER BY month;\n```\n\nHere are the results:\n\nJanuary 2025: $42,580\nFebruary 2025: $51,320\nMarch 2025 (partial): $18,750\n\nTotal Q1 revenue so far: $112,650",
        timestamp: new Date(start.getTime() + 5 * 60000),
      },
      {
        role: 'user',
        content: "That's helpful. Can you also check how many new customers we've acquired in the same period?",
        timestamp: new Date(start.getTime() + 8 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I'll query your Stripe account for new customer acquisition data.\n\n```sql\nSELECT DATE_TRUNC('month', created) as month, COUNT(DISTINCT customer) as new_customers\nFROM customers\nWHERE created >= NOW() - INTERVAL '3 months'\nGROUP BY month\nORDER BY month;\n```\n\nHere are the results:\n\nJanuary 2025: 18 new customers\nFebruary 2025: 23 new customers\nMarch 2025 (partial): 7 new customers\n\nTotal new customers in Q1 so far: 48",
        timestamp: new Date(start.getTime() + 10 * 60000),
      },
      {
        role: 'user',
        content:
          "Now I'd like to check our churn rate. Can you query our PostgreSQL database to find out how many customers canceled in the same period?",
        timestamp: new Date(start.getTime() + 14 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I'll query your PostgreSQL database for customer churn data.\n\n```sql\nSELECT DATE_TRUNC('month', canceled_at) as month, COUNT(*) as churned_customers\nFROM subscriptions\nWHERE canceled_at >= NOW() - INTERVAL '3 months'\nGROUP BY month\nORDER BY month;\n```\n\nHere are the results:\n\nJanuary 2025: 5 churned customers\nFebruary 2025: 4 churned customers\nMarch 2025 (partial): 2 churned customers\n\nTotal churned customers in Q1 so far: 11\n\nBased on your total customer base of 215 at the beginning of the quarter, this represents a quarterly churn rate of approximately 5.1%.",
        timestamp: new Date(start.getTime() + 17 * 60000),
      },
      {
        role: 'user',
        content: 'Can you identify our top 3 customers by revenue in this quarter?',
        timestamp: new Date(start.getTime() + 22 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I'll query your Stripe data to identify the top 3 customers by revenue this quarter.\n\n```sql\nSELECT c.name, c.email, SUM(ch.amount)/100 as revenue\nFROM charges ch\nJOIN customers c ON ch.customer = c.id\nWHERE ch.status = 'succeeded' AND ch.created >= NOW() - INTERVAL '3 months'\nGROUP BY c.id, c.name, c.email\nORDER BY revenue DESC\nLIMIT 3;\n```\n\nHere are your top 3 customers by revenue this quarter:\n\n1. Acme Corporation (acme@example.com): $12,500\n2. TechNova Solutions (billing@technova.com): $8,750\n3. Global Enterprises Ltd (finance@globalent.com): $7,200",
        timestamp: new Date(start.getTime() + 25 * 60000),
      },
      {
        role: 'user',
        content:
          "I'd like to see which subscription tier is performing best. Can you show me the revenue breakdown by plan?",
        timestamp: new Date(start.getTime() + 30 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I'll query your database for revenue breakdown by subscription plan.\n\n```sql\nSELECT p.name as plan_name, COUNT(DISTINCT s.customer_id) as customer_count, SUM(i.amount_paid)/100 as revenue\nFROM subscriptions s\nJOIN plans p ON s.plan_id = p.id\nJOIN invoices i ON i.subscription_id = s.id\nWHERE i.status = 'paid' AND i.created >= NOW() - INTERVAL '3 months'\nGROUP BY p.name\nORDER BY revenue DESC;\n```\n\nHere's the revenue breakdown by plan for Q1 so far:\n\n1. Enterprise Plan: $58,500 (12 customers)\n2. Professional Plan: $36,750 (35 customers)\n3. Starter Plan: $17,400 (58 customers)\n\nThe Enterprise Plan is generating the most revenue despite having the fewest customers, which aligns with its higher price point.",
        timestamp: new Date(start.getTime() + 33 * 60000),
      },
      {
        role: 'user',
        content:
          'Based on this data, can you suggest which customer segment we should focus our marketing efforts on for the next quarter?',
        timestamp: new Date(start.getTime() + 38 * 60000),
      },
      {
        role: 'assistant',
        content:
          "Based on the data we've analyzed, I recommend focusing your marketing efforts on mid-sized companies that would be good candidates for your Professional Plan, with potential for upselling to Enterprise.\n\nThe Professional Plan shows strong adoption (35 customers) with substantial revenue ($36,750). The Enterprise Plan, while having fewer customers (12), generates the highest revenue ($58,500).\n\nYour customer acquisition cost appears to be most efficient in the Professional segment, and these customers have demonstrated willingness to pay for premium features. Additionally, Professional Plan customers who grow could become Enterprise customers, increasing your revenue without proportional acquisition costs.\n\nI suggest targeting industries similar to your top performers like Acme Corporation and TechNova Solutions, as they've shown the highest revenue potential.",
        timestamp: new Date(start.getTime() + 42 * 60000),
      },
      {
        role: 'user',
        content:
          'That makes sense. Can you help me set up an automated report that sends these metrics to our executive team every month?',
        timestamp: new Date(start.getTime() + 48 * 60000),
      },
      {
        role: 'assistant',
        content:
          "I can help you set up an automated monthly report. Here's what we'll need to do:\n\n1. Create a PostgreSQL stored procedure that runs all the queries we've discussed\n2. Set up a scheduled job to execute this procedure monthly\n3. Configure the output to be formatted as a PDF or spreadsheet\n4. Set up email delivery to your executive team\n\nWould you like me to generate the SQL for the stored procedure first? Or would you prefer to start with the scheduling configuration?",
        timestamp: new Date(start.getTime() + 51 * 60000),
      },
      {
        role: 'user',
        content: "Let's start with the SQL for the stored procedure please.",
        timestamp: new Date(start.getTime() + 55 * 60000),
      },
      {
        role: 'assistant',
        content:
          "Here's the SQL to create a stored procedure for your monthly executive report:\n\n```sql\nCREATE OR REPLACE PROCEDURE generate_monthly_executive_report()\nLANGUAGE plpgsql AS $$\nDECLARE\n  report_month DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');\n  report_data JSONB;\nBEGIN\n  -- Monthly revenue\n  WITH monthly_revenue AS (\n    SELECT DATE_TRUNC('month', created) as month, SUM(amount)/100 as revenue\n    FROM charges\n    WHERE status = 'succeeded' \n      AND created >= report_month - INTERVAL '2 months'\n      AND created < report_month + INTERVAL '1 month'\n    GROUP BY month\n    ORDER BY month\n  ),\n  \n  -- New customers\n  new_customers AS (\n    SELECT DATE_TRUNC('month', created) as month, COUNT(DISTINCT customer) as count\n    FROM customers\n    WHERE created >= report_month - INTERVAL '2 months'\n      AND created < report_month + INTERVAL '1 month'\n    GROUP BY month\n    ORDER BY month\n  ),\n  \n  -- Churned customers\n  churned AS (\n    SELECT DATE_TRUNC('month', canceled_at) as month, COUNT(*) as count\n    FROM subscriptions\n    WHERE canceled_at >= report_month - INTERVAL '2 months'\n      AND canceled_at < report_month + INTERVAL '1 month'\n    GROUP BY month\n    ORDER BY month\n  ),\n  \n  -- Plan performance\n  plan_performance AS (\n    SELECT p.name as plan_name, COUNT(DISTINCT s.customer_id) as customer_count, \n           SUM(i.amount_paid)/100 as revenue\n    FROM subscriptions s\n    JOIN plans p ON s.plan_id = p.id\n    JOIN invoices i ON i.subscription_id = s.id\n    WHERE i.status = 'paid' \n      AND i.created >= report_month\n      AND i.created < report_month + INTERVAL '1 month'\n    GROUP BY p.name\n    ORDER BY revenue DESC\n  )\n  \n  -- Compile report data\n  SELECT jsonb_build_object(\n    'report_period', to_char(report_month, 'Month YYYY'),\n    'monthly_revenue', (SELECT jsonb_agg(row_to_json(r)) FROM monthly_revenue r),\n    'new_customers', (SELECT jsonb_agg(row_to_json(c)) FROM new_customers c),\n    'churned_customers', (SELECT jsonb_agg(row_to_json(ch)) FROM churned ch),\n    'plan_performance', (SELECT jsonb_agg(row_to_json(p)) FROM plan_performance p)\n  ) INTO report_data;\n  \n  -- Insert into reports table\n  INSERT INTO executive_reports (report_date, report_data)\n  VALUES (report_month, report_data);\n  \n  -- Log completion\n  RAISE NOTICE 'Executive report generated for %', to_char(report_month, 'Month YYYY');\nEND;\n$$;\n```\n\nThis stored procedure:\n1. Calculates the previous month as the reporting period\n2. Gathers revenue, customer acquisition, churn, and plan performance data\n3. Compiles everything into a structured JSON object\n4. Stores the report in an executive_reports table\n\nYou'll need to create the executive_reports table if it doesn't exist:\n\n```sql\nCREATE TABLE IF NOT EXISTS executive_reports (\n  id SERIAL PRIMARY KEY,\n  report_date DATE NOT NULL,\n  report_data JSONB NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n```\n\nWould you like me to proceed with the scheduling configuration next?",
        timestamp: new Date(start.getTime() + 60 * 60000),
      },
    ],
  };
};

export interface MCPServerConfig {
  name: string;
  category: string;
  requiresAuth: boolean;
  developer: string;
  sourceUrl: string;
  icon: {
    light: string;
    dark: string;
  };
}

export const generateMockServers = () => {
  return [
    {
      name: 'Stripe',
      category: 'finance',
      requiresAuth: true,
      developer: 'Stripe',
      sourceUrl: 'https://github.com/stripe/stripe-mcp',
      icon: {
        light: '/logos/stripe.svg',
        dark: '/logos/stripe.svg',
      },
    },
    {
      name: 'Github',
      category: 'developer',
      requiresAuth: true,
      developer: 'MCP',
      sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
      icon: {
        dark: '/logos/github-dark.svg',
        light: '/logos/github-light.svg',
      },
    },
    {
      name: 'Fetch',
      category: 'utilities',
      requiresAuth: false,
      developer: 'MCP',
      sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
      icon: {
        dark: '/logos/fetch-dark.svg',
        light: '/logos/fetch-light.svg',
      },
    },
    {
      name: 'Memory',
      category: 'utilities',
      requiresAuth: false,
      developer: 'MCP',
      sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
      icon: {
        dark: '/logos/memory-dark.svg',
        light: '/logos/memory-light.svg',
      },
    },
    {
      name: 'Linear',
      category: 'productivity',
      requiresAuth: true,
      developer: 'Linear',
      sourceUrl: 'https://github.com/vinayak-mehta/linear-mcp',
      icon: {
        dark: '/logos/linear-light.svg',
        light: '/logos/linear-dark.svg',
      },
    },
    {
      name: 'Slack',
      category: 'communication',
      requiresAuth: true,
      developer: 'Slack',
      sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
      icon: {
        dark: '/logos/slack.svg',
        light: '/logos/slack.svg',
      },
    },
    {
      name: 'Obsidian',
      category: 'productivity',
      requiresAuth: true,
      developer: 'Markus Pfundstein',
      sourceUrl: 'https://github.com/MarkusPfundstein/mcp-obsidian',
      icon: {
        dark: '/logos/obsidian.svg',
        light: '/logos/obsidian.svg',
      },
    },
    {
      name: 'Rember',
      category: 'productivity',
      requiresAuth: true,
      developer: 'Rember',
      sourceUrl: 'https://github.com/rember/rember-mcp',
      icon: {
        dark: '/logos/rember.png',
        light: '/logos/rember.png',
      },
    },
    {
      name: 'Browser',
      category: 'utilities',
      requiresAuth: false,
      developer: 'Google LLC',
      sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
      icon: {
        dark: '/logos/browser-dark.svg',
        light: '/logos/browser-light.svg',
      },
    },
    {
      name: 'Hacker News',
      category: 'social',
      requiresAuth: false,
      developer: 'Y Combinator',
      sourceUrl: 'https://github.com/erithwik/mcp-hn',
      icon: {
        dark: '/logos/yc.svg',
        light: '/logos/yc.svg',
      },
    },
  ] satisfies MCPServerConfig[];
};
