package models

import "errors"

var (
	ErrNilResource = errors.New("resource is nil")
	ErrNilUser     = errors.New("user is nil")
)
