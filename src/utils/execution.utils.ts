export class ExecutionUtils {

    /**
     * Checks if the execution is valid by checking the topic and executionTime.
     *
     * @param topic
     * @param executionTime
     */
    public static isExecutionValid(topic: string, executionTime: string): boolean {
        if (!topic || topic.length === 0 || topic.length <= 2 || topic.length > 30) {
            return false;
        }

        if (!executionTime || executionTime.length === 0) {
            return false;
        }

        // Check if string is a valid time format (HH:MM)
        const timeRegex = new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$");
        return timeRegex.test(executionTime);
    }
}