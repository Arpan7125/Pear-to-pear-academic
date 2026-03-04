package models

import "encoding/json"

// ResourceToJSON marshals a Resource into JSON bytes.
func ResourceToJSON(resource *Resource) ([]byte, error) {
	if resource == nil {
		return nil, ErrNilResource
	}
	return json.Marshal(resource)
}

// ResourceFromJSON unmarshals JSON bytes into a Resource.
func ResourceFromJSON(data []byte) (*Resource, error) {
	var resource Resource
	if err := json.Unmarshal(data, &resource); err != nil {
		return nil, err
	}
	return &resource, nil
}

// UserToJSON marshals a User into JSON bytes.
func UserToJSON(user *User) ([]byte, error) {
	if user == nil {
		return nil, ErrNilUser
	}
	return json.Marshal(user)
}

// UserFromJSON unmarshals JSON bytes into a User.
func UserFromJSON(data []byte) (*User, error) {
	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, err
	}
	return &user, nil
}
