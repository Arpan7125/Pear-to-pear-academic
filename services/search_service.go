// Package services - Search service
package services

import (
	"sort"
	"strings"
	"p2p-library/models"
	"p2p-library/store"
)

type SearchService struct {
	store *store.MemoryStore
}

func NewSearchService(store *store.MemoryStore) *SearchService {
	return &SearchService{store: store}
}

type SearchFilters struct {
	Subject   string              `json:"subject,omitempty"`
	Type      models.ResourceType `json:"type,omitempty"`
	MinRating float64             `json:"min_rating,omitempty"`
	Tags      []string            `json:"tags,omitempty"`
	SortBy    string              `json:"sort_by,omitempty"`
	SortOrder string              `json:"sort_order,omitempty"`
	Page      int                 `json:"page,omitempty"`
	PageSize  int                 `json:"page_size,omitempty"`
}

func (s *SearchService) Search(query string, filters SearchFilters) (*models.SearchResults, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}
	
	query = strings.ToLower(strings.TrimSpace(query))
	results := make([]*models.SearchResult, 0)
	
	for _, resource := range all {
		relevance := s.calculateRelevance(resource, query)
		if query != "" && relevance == 0 {
			continue
		}
		if !s.matchesFilters(resource, filters) {
			continue
		}
		results = append(results, &models.SearchResult{
			Resource:       resource,
			AvailablePeers: len(resource.AvailableOn),
			Relevance:      relevance,
		})
	}
	
	s.sortResults(results, filters.SortBy, filters.SortOrder)
	totalCount := len(results)
	results = s.paginate(results, filters.Page, filters.PageSize)
	
	return &models.SearchResults{
		Query:      query,
		Results:    results,
		TotalCount: totalCount,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
	}, nil
}

func (s *SearchService) SearchBySubject(subject string) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}
	results := make([]*models.Resource, 0)
	for _, r := range all {
		if strings.EqualFold(r.Subject, subject) {
			results = append(results, r)
		}
	}
	return results, nil
}

func (s *SearchService) SearchByTag(tag string) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}
	results := make([]*models.Resource, 0)
	for _, r := range all {
		for _, t := range r.Tags {
			if strings.EqualFold(t, tag) {
				results = append(results, r)
				break
			}
		}
	}
	return results, nil
}

func (s *SearchService) GetSuggestions(partial string) ([]string, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}
	partial = strings.ToLower(partial)
	seen := make(map[string]bool)
	for _, r := range all {
		if strings.Contains(strings.ToLower(r.Title), partial) {
			seen[r.Title] = true
		}
		if strings.Contains(strings.ToLower(r.Subject), partial) {
			seen[r.Subject] = true
		}
	}
	result := make([]string, 0, len(seen))
	for s := range seen {
		result = append(result, s)
	}
	sort.Strings(result)
	if len(result) > 10 {
		result = result[:10]
	}
	return result, nil
}

func (s *SearchService) calculateRelevance(r *models.Resource, query string) float64 {
	if query == "" {
		return 1.0
	}
	rel := 0.0
	if strings.Contains(strings.ToLower(r.Title), query) {
		rel += 3.0
	}
	if strings.Contains(strings.ToLower(r.Filename), query) {
		rel += 2.0
	}
	if strings.Contains(strings.ToLower(r.Subject), query) {
		rel += 1.5
	}
	return rel
}

func (s *SearchService) matchesFilters(r *models.Resource, f SearchFilters) bool {
	if f.Subject != "" && !strings.EqualFold(r.Subject, f.Subject) {
		return false
	}
	if f.Type != "" && r.Type != f.Type {
		return false
	}
	if f.MinRating > 0 && r.AverageRating < f.MinRating {
		return false
	}
	return true
}

func (s *SearchService) sortResults(results []*models.SearchResult, by, order string) {
	sort.Slice(results, func(i, j int) bool {
		var less bool
		switch by {
		case "rating":
			less = results[i].Resource.AverageRating < results[j].Resource.AverageRating
		case "downloads":
			less = results[i].Resource.DownloadCount < results[j].Resource.DownloadCount
		default:
			less = results[i].Relevance < results[j].Relevance
		}
		if order == "desc" {
			return !less
		}
		return less
	})
}

func (s *SearchService) paginate(results []*models.SearchResult, page, size int) []*models.SearchResult {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}
	offset := (page - 1) * size
	if offset >= len(results) {
		return []*models.SearchResult{}
	}
	end := offset + size
	if end > len(results) {
		end = len(results)
	}
	return results[offset:end]
}
