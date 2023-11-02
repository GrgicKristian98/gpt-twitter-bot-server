import {OpenAI} from "langchain/llms/openai";
import {PromptTemplate} from "langchain/prompts";
import {DynamicTool, GoogleCustomSearch} from "langchain/tools";
import {ExtractorAPI} from "./tools/extractor.tool";
import {AgentExecutor, initializeAgentExecutorWithOptions} from "langchain/agents";

export class GPTUtils {
    private readonly llm: OpenAI;
    private readonly tools: any;
    private prompt: PromptTemplate;

    constructor() {
        this.llm = new OpenAI({
            temperature: 0.5,
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-3.5-turbo-16k",
            maxTokens: 280,
        });

        const template: string =
            `Use google-custom-search tool to search for the latest news and create a tweet about {query} .
             Include emojis, hashtags, and ensure it's factual and informative. 
             Before outputting the tweet, validate it's length using tweetcharactercount tool.`;

        this.prompt = new PromptTemplate({
            template: template,
            inputVariables: ["query"],
        });

        this.tools = [
            //new SerpAPI(),
            new GoogleCustomSearch(),
            new DynamicTool({
                name: "extractorapi",
                func: ExtractorAPI.extractFromURL,
                description:
                    `
                    Extracts text from a website. The input must be a valid URL to the website.
                    In the output, you will get the text content of the website, which can be used as information for creating an informative tweet.
                    Example input: https://openai.com/blog/openai-and-microsoft-extend-partnership/
                    `
            }),
            new DynamicTool({
                name: "tweetcharactercount",
                func: GPTUtils.characterCount,
                description:
                    `
                    Checks if a tweet is valid by counting the number of characters in the tweet.
                    In the output, you will get the text content describing if the tweet is valid or invalid.
                    Example input: This is a tweet.
                    `
            })
        ];
    }

    public async generateTweet(query: string): Promise<string> {
        const agent: AgentExecutor = await initializeAgentExecutorWithOptions(this.tools, this.llm, {
            agentType: "zero-shot-react-description",
            verbose: true,
            maxIterations: 20,
        });

        const prompt = await this.prompt.format({
            query: query,
        });

        const output = await agent.run(prompt);

        const firstChar = output.charAt(0);
        const lastChar = output.charAt(output.length - 1);

        if (firstChar === "\"" && lastChar === "\"") {
            return output.slice(1, -1);
        }

        return output;
    }

    private static characterCount(tweet: string): Promise<string> {
        return Promise.resolve((tweet.length <= 280) ? "Tweet is valid" : "Tweet is invalid");
    }
}