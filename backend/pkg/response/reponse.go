package response

import AppMessage "magic/backend/pkg/constants"

type BaseResponse struct {
	Status   int    `json:"status"`
	Message  string `json:"message"`
	Response any    `json:"response"`
}

func SuccessReponse(status int, message string, response any) *BaseResponse {
	return &BaseResponse{
		status,
		AppMessage.SuccessMessage,
		response,
	}
}

func ErrorResponse(status int, message string, response any) *BaseResponse {
	return &BaseResponse{
		status,
		AppMessage.ErrorMessage,
		response,
	}
}
