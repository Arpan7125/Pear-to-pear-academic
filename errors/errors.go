// Package errors provides custom error types and handling utilities.
//
// GO CONCEPT 5: FUNCTIONS AND ERROR HANDLING
// This file demonstrates:
// - Custom error types implementing the error interface
// - Error wrapping and context
// - Sentinel errors (predefined error values)
// - Error type assertions
package errors

import (
	"fmt"
)

// ============================================================================
// SENTINEL ERRORS
// ============================================================================
// Sentinel errors are predefined error values that can be compared directly.
// They are useful for common, expected error conditions.

// Common errors
var (
	ErrNotFound          = fmt.Errorf("resource not found")
	ErrUserNotFound      = fmt.Errorf("user not found")
	ErrResourceNotFound  = fmt.Errorf("resource not found")
	ErrPeerNotFound      = fmt.Errorf("peer not found")
	ErrRatingNotFound    = fmt.Errorf("rating not found")
	
	ErrAlreadyExists     = fmt.Errorf("resource already exists")
	ErrUserAlreadyExists = fmt.Errorf("user already exists")
	
	ErrInvalidInput      = fmt.Errorf("invalid input")
	ErrInvalidRating     = fmt.Errorf("rating must be between 1 and 5")
	ErrInvalidFileType   = fmt.Errorf("file type not allowed")
	ErrFileTooLarge      = fmt.Errorf("file exceeds maximum size")
	
	ErrUnauthorized      = fmt.Errorf("unauthorized access")
	ErrForbidden         = fmt.Errorf("access forbidden")
	
	ErrConnectionFailed  = fmt.Errorf("peer connection failed")
	ErrTransferFailed    = fmt.Errorf("file transfer failed")
)

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================
// Custom error types provide more context about errors.
// They implement the error interface by having an Error() method.

// ValidationError represents a validation failure
type ValidationError struct {
	Field   string // The field that failed validation
	Message string // Description of the validation error
}

// Error implements the error interface
func (e ValidationError) Error() string {
	return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

// NewValidationError creates a new ValidationError
func NewValidationError(field, message string) ValidationError {
	return ValidationError{
		Field:   field,
		Message: message,
	}
}

// ============================================================================
// NOT FOUND ERROR
// ============================================================================

// NotFoundError represents a resource not found error
type NotFoundError struct {
	ResourceType string // Type of resource (user, file, peer, etc.)
	Identifier   string // The ID or name that wasn't found
}

// Error implements the error interface
func (e NotFoundError) Error() string {
	return fmt.Sprintf("%s with identifier '%s' not found", e.ResourceType, e.Identifier)
}

// NewNotFoundError creates a new NotFoundError
func NewNotFoundError(resourceType, identifier string) NotFoundError {
	return NotFoundError{
		ResourceType: resourceType,
		Identifier:   identifier,
	}
}

// ============================================================================
// OPERATION ERROR
// ============================================================================

// OperationError represents an error during an operation
type OperationError struct {
	Operation string // Name of the operation
	Reason    string // Why it failed
	Err       error  // Underlying error (for wrapping)
}

// Error implements the error interface
func (e OperationError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("operation '%s' failed: %s (caused by: %v)", e.Operation, e.Reason, e.Err)
	}
	return fmt.Sprintf("operation '%s' failed: %s", e.Operation, e.Reason)
}

// Unwrap returns the underlying error (for errors.Unwrap)
func (e OperationError) Unwrap() error {
	return e.Err
}

// NewOperationError creates a new OperationError
func NewOperationError(operation, reason string, err error) OperationError {
	return OperationError{
		Operation: operation,
		Reason:    reason,
		Err:       err,
	}
}

// ============================================================================
// REPUTATION ERROR
// ============================================================================

// ReputationError represents an error related to reputation/access
type ReputationError struct {
	UserID      string
	Required    int
	Current     int
	Action      string
}

// Error implements the error interface
func (e ReputationError) Error() string {
	return fmt.Sprintf("user '%s' has insufficient reputation for '%s': required %d, current %d",
		e.UserID, e.Action, e.Required, e.Current)
}

// NewReputationError creates a new ReputationError
func NewReputationError(userID string, required, current int, action string) ReputationError {
	return ReputationError{
		UserID:   userID,
		Required: required,
		Current:  current,
		Action:   action,
	}
}

// ============================================================================
// ERROR HELPER FUNCTIONS
// ============================================================================

// IsNotFound checks if the error is a NotFoundError
func IsNotFound(err error) bool {
	_, ok := err.(NotFoundError)
	if ok {
		return true
	}
	// Also check for sentinel errors
	return err == ErrNotFound || err == ErrUserNotFound || 
	       err == ErrResourceNotFound || err == ErrPeerNotFound
}

// IsValidationError checks if the error is a ValidationError
func IsValidationError(err error) bool {
	_, ok := err.(ValidationError)
	return ok
}

// IsReputationError checks if the error is a ReputationError
func IsReputationError(err error) bool {
	_, ok := err.(ReputationError)
	return ok
}

// WrapError wraps an error with additional context
func WrapError(operation string, err error) error {
	if err == nil {
		return nil
	}
	return NewOperationError(operation, "operation failed", err)
}
