package models

import (
	"strings"
	"testing"
)

func TestResourceJSONRoundTrip(t *testing.T) {
	resource := NewResource("distributed_systems.pdf", 2*ChunkSize, UserID("user-1"))
	resource.Title = "Distributed Systems"
	resource.Subject = "Computer Science"
	resource.Tags = []string{"p2p", "systems"}
	resource.AddPeer(PeerID("peer-1"))
	resource.AddRating(Rating(4.0))

	data, err := ResourceToJSON(resource)
	if err != nil {
		t.Fatalf("ResourceToJSON failed: %v", err)
	}

	decoded, err := ResourceFromJSON(data)
	if err != nil {
		t.Fatalf("ResourceFromJSON failed: %v", err)
	}

	if decoded.ID != resource.ID {
		t.Fatalf("ID mismatch: got %s want %s", decoded.ID, resource.ID)
	}
	if decoded.Title != resource.Title {
		t.Fatalf("Title mismatch: got %s want %s", decoded.Title, resource.Title)
	}
	if len(decoded.Tags) != len(resource.Tags) {
		t.Fatalf("Tags length mismatch: got %d want %d", len(decoded.Tags), len(resource.Tags))
	}
}

func TestUserJSONRoundTripAndPasswordOmitted(t *testing.T) {
	user := NewUser(UserID("user-2"), "alice", "alice@uni.edu")
	user.Password = "super-secret"
	user.PeerID = PeerID("peer-alice")
	user.Status = StatusOnline

	data, err := UserToJSON(user)
	if err != nil {
		t.Fatalf("UserToJSON failed: %v", err)
	}

	if strings.Contains(string(data), "super-secret") {
		t.Fatalf("password should not be present in marshaled JSON")
	}

	decoded, err := UserFromJSON(data)
	if err != nil {
		t.Fatalf("UserFromJSON failed: %v", err)
	}

	if decoded.Username != user.Username {
		t.Fatalf("Username mismatch: got %s want %s", decoded.Username, user.Username)
	}
	if decoded.Password != "" {
		t.Fatalf("Password should remain empty after unmarshal due to json tag exclusion")
	}
}

func TestResourceFromJSONInvalidInput(t *testing.T) {
	invalid := []byte(`{"id":`)
	_, err := ResourceFromJSON(invalid)
	if err == nil {
		t.Fatalf("expected unmarshal error for invalid JSON")
	}
}

func TestJSONNilGuards(t *testing.T) {
	_, err := ResourceToJSON(nil)
	if err == nil {
		t.Fatalf("expected error for nil resource")
	}

	_, err = UserToJSON(nil)
	if err == nil {
		t.Fatalf("expected error for nil user")
	}
}
