import {Router} from 'express';
import {ExecutionController} from "../controllers/execution.controller";
import {CustomRequest} from "../interfaces/customRequest.interface";
import {verifyToken} from "../middleware/verifyToken.middleware";
import {HttpError} from "../errors/http.error";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";

const router = Router();
const executionController = new ExecutionController();

router.post('/api/execution', verifyToken, async (req: CustomRequest, res) => {
    const userId = req.userId;
    const execution = req.body.execution;

    executionController
        .saveExecution(userId, execution)
        .then((execution) => res.status(HttpStatusCodes.CREATED).json({execution: execution}))
        .catch((err) => {
            res.status((err instanceof HttpError) ? err.getHttpCode() : HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json({message: err.message});
        });
});

router.put('/api/execution', verifyToken, async (req: CustomRequest, res) => {
    const userId = req.userId;
    const execution = req.body.execution;

    executionController
        .updateExecution(userId, execution)
        .then((execution) => res.status(HttpStatusCodes.OK).json({execution: execution}))
        .catch((err) => {
            res.status((err instanceof HttpError) ? err.getHttpCode() : HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json({message: err.message});
        });
});

router.delete('/api/execution/:id', verifyToken, async (req: CustomRequest, res) => {
    const userId = req.userId;
    const executionId = req.params.id;

    executionController
        .deleteExecution(userId, executionId)
        .then((result) => res.status(HttpStatusCodes.OK).json({result: result}))
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

router.get('/api/execution/all', verifyToken, async (req: CustomRequest, res) => {
    const userId = req.userId;

    executionController
        .getExecutionsForUser(userId)
        .then((executions) => res.status(HttpStatusCodes.OK).json({executions: executions}))
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

export default router;