export class ExtractorAPI {
    public static async extractFromURL(url: string): Promise<string> {
        const extractorApiUrl = process.env.EXTRACTOR_API_URL;
        const extractorApiKey = process.env.EXTRACTOR_API_KEY;

        const fetchUrl = `${extractorApiUrl}?apikey=${encodeURIComponent(extractorApiKey)}&url=${encodeURIComponent(url)}`;
        const response = await fetch(fetchUrl, {method: "GET"});

        const json = await response.json();
        if (json && json.text) {
            return json.text;
        } else {
            throw new Error("Error extracting text from URL");
        }
    }
}