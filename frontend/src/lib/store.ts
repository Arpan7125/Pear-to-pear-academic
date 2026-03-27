// In-memory data store for serverless deployment (Vercel)
// Mirrors the Go backend's data model with seeded demo data
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface StoreUser {
  id: string;
  peer_id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  reputation: number;
  classification: 'Contributor' | 'Neutral' | 'Leecher';
  total_uploads: number;
  total_downloads: number;
  average_rating: number;
  created_at: string;
  last_active_at: string;
  status: 'online' | 'offline';
  ip_address: string;
}

export interface StoreResource {
  id: string;
  original_id: string;
  filename: string;
  extension: string;
  size: number;
  type: 'pdf' | 'document' | 'presentation' | 'spreadsheet' | 'other';
  mime_type: string;
  title: string;
  description: string;
  preview: string;
  subject: string;
  tags: string[];
  uploaded_by: string;
  available_on: string[];
  chunk_count: number;
  total_ratings: number;
  average_rating: number;
  ratings_sum: number;
  created_at: string;
  updated_at: string;
  download_count: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function classifyUser(uploads: number, downloads: number): 'Contributor' | 'Neutral' | 'Leecher' {
  const score = (uploads * 2) - downloads;
  if (score > 5) return 'Contributor';
  if (score >= 0) return 'Neutral';
  return 'Leecher';
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.substring(idx) : '';
}

function getResourceType(ext: string): StoreResource['type'] {
  switch (ext.toLowerCase()) {
    case '.pdf': return 'pdf';
    case '.doc': case '.docx': case '.txt': case '.md': return 'document';
    case '.ppt': case '.pptx': return 'presentation';
    case '.xls': case '.xlsx': case '.csv': return 'spreadsheet';
    default: return 'other';
  }
}

// ============================================================================
// STORE
// ============================================================================

class DataStore {
  users: Map<string, StoreUser> = new Map();
  resources: Map<string, StoreResource> = new Map();

  constructor() {
    this.seed();
  }

  // ---- User methods ----

  createUser(username: string, email: string, password: string): StoreUser {
    const id = generateId();
    const user: StoreUser = {
      id,
      peer_id: `peer-${id.slice(0, 8)}`,
      username,
      email,
      password,
      role: 'user',
      reputation: 0,
      classification: 'Neutral',
      total_uploads: 0,
      total_downloads: 0,
      average_rating: 0,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      status: 'online',
      ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    };
    this.users.set(id, user);
    return user;
  }

  findUserByUsername(username: string): StoreUser | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  getUser(id: string): StoreUser | undefined {
    return this.users.get(id);
  }

  getAllUsers(): StoreUser[] {
    return Array.from(this.users.values());
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // ---- Resource methods ----

  createResource(filename: string, size: number, uploadedBy: string, meta: {
    title?: string; description?: string; preview?: string; subject?: string; tags?: string[];
  }): StoreResource {
    const id = generateId();
    const ext = getExtension(filename);
    const resource: StoreResource = {
      id,
      original_id: id.slice(0, 8),
      filename,
      extension: ext,
      size,
      type: getResourceType(ext),
      mime_type: 'application/octet-stream',
      title: meta.title || filename,
      description: meta.description || '',
      preview: meta.preview || '',
      subject: meta.subject || 'Other',
      tags: meta.tags || [],
      uploaded_by: uploadedBy,
      available_on: [],
      chunk_count: Math.ceil(size / (256 * 1024)),
      total_ratings: 0,
      average_rating: 0,
      ratings_sum: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_count: 0,
    };

    // Add uploader's peer to available_on
    const uploader = this.users.get(uploadedBy);
    if (uploader) {
      resource.available_on = [uploader.peer_id];
      uploader.total_uploads += 1;
      uploader.reputation = (uploader.total_uploads * 2) - uploader.total_downloads + (uploader.average_rating * 10);
      uploader.classification = classifyUser(uploader.total_uploads, uploader.total_downloads);
    }

    this.resources.set(id, resource);
    return resource;
  }

  getResource(id: string): StoreResource | undefined {
    return this.resources.get(id);
  }

  getAllResources(): StoreResource[] {
    return Array.from(this.resources.values());
  }

  deleteResource(id: string): boolean {
    return this.resources.delete(id);
  }

  downloadResource(resourceId: string, userId: string): StoreResource | undefined {
    const resource = this.resources.get(resourceId);
    if (!resource) return undefined;
    resource.download_count += 1;

    const user = this.users.get(userId);
    if (user) {
      user.total_downloads += 1;
      user.classification = classifyUser(user.total_uploads, user.total_downloads);
    }
    return resource;
  }

  rateResource(resourceId: string, rating: number): StoreResource | undefined {
    const resource = this.resources.get(resourceId);
    if (!resource) return undefined;
    resource.total_ratings += 1;
    resource.ratings_sum += rating;
    resource.average_rating = resource.ratings_sum / resource.total_ratings;
    resource.updated_at = new Date().toISOString();

    // Update uploader reputation
    const uploader = this.users.get(resource.uploaded_by);
    if (uploader) {
      // Recalculate average rating across all their resources
      const userResources = this.getAllResources().filter(r => r.uploaded_by === uploader.id);
      const totalRated = userResources.filter(r => r.total_ratings > 0);
      if (totalRated.length > 0) {
        uploader.average_rating = totalRated.reduce((sum, r) => sum + r.average_rating, 0) / totalRated.length;
      }
      uploader.reputation = (uploader.total_uploads * 2) - uploader.total_downloads + (uploader.average_rating * 10);
      uploader.classification = classifyUser(uploader.total_uploads, uploader.total_downloads);
    }

    return resource;
  }

  searchResources(query: string, subject?: string): StoreResource[] {
    let results = this.getAllResources();
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.filename.toLowerCase().includes(q)
      );
    }
    if (subject) {
      results = results.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    }
    return results;
  }

  getPopularResources(limit: number): StoreResource[] {
    return this.getAllResources()
      .sort((a, b) => b.download_count - a.download_count)
      .slice(0, limit);
  }

  getRecentResources(limit: number): StoreResource[] {
    return this.getAllResources()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  getLeaderboard(limit: number): StoreUser[] {
    return this.getAllUsers()
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
  }

  getNetworkStats() {
    const users = this.getAllUsers();
    const contributors = users.filter(u => u.classification === 'Contributor').length;
    const neutral = users.filter(u => u.classification === 'Neutral').length;
    const leechers = users.filter(u => u.classification === 'Leecher').length;
    const avgScore = users.length > 0 ? users.reduce((s, u) => s + u.reputation, 0) / users.length : 0;
    return { total_users: users.length, contributors, neutral, leechers, average_score: parseFloat(avgScore.toFixed(1)) };
  }

  getLibraryStats() {
    const resources = this.getAllResources();
    const bySubject: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalDownloads = 0;
    let totalRatings = 0;
    for (const r of resources) {
      bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
      byType[r.type] = (byType[r.type] || 0) + 1;
      totalDownloads += r.download_count;
      totalRatings += r.total_ratings;
    }
    return { total_resources: resources.length, total_downloads: totalDownloads, total_ratings: totalRatings, by_subject: bySubject, by_type: byType };
  }

  // ---- Seed Demo Data ----
  private seed() {
    // Create demo users
    const alice = this.createUser('alice', 'alice@university.edu', 'password');
    alice.role = 'admin';
    alice.reputation = 85;
    alice.classification = 'Contributor';

    const bob = this.createUser('bob', 'bob@university.edu', 'password');
    bob.reputation = 45;
    bob.classification = 'Contributor';

    const charlie = this.createUser('charlie', 'charlie@university.edu', 'password');
    charlie.reputation = 20;
    charlie.classification = 'Neutral';

    const diana = this.createUser('diana', 'diana@university.edu', 'password');
    diana.reputation = 10;
    diana.classification = 'Neutral';

    // Seed resources
    const seedResources = [
      { filename: 'go_fundamentals.pdf', title: 'Go Programming Fundamentals', subject: 'Computer Science', size: 2500000, tags: ['golang', 'programming', 'tutorial'], uploader: alice.id, downloads: 25, rating: 4.2 },
      { filename: 'classical_mechanics.pdf', title: 'Classical Mechanics', subject: 'Physics', size: 4100000, tags: ['physics', 'mechanics'], uploader: bob.id, downloads: 41, rating: 4.0 },
      { filename: 'database_design.pdf', title: 'Database Design Principles', subject: 'Computer Science', size: 2800000, tags: ['database', 'sql', 'design'], uploader: alice.id, downloads: 28, rating: 4.5 },
      { filename: 'thermodynamics.pdf', title: 'Engineering Thermodynamics', subject: 'Physics', size: 2900000, tags: ['thermodynamics', 'energy'], uploader: charlie.id, downloads: 29, rating: 3.8 },
      { filename: 'discrete_math.pdf', title: 'Discrete Mathematics', subject: 'Mathematics', size: 3200000, tags: ['math', 'discrete', 'logic'], uploader: alice.id, downloads: 35, rating: 4.3 },
      { filename: 'linear_algebra.pdf', title: 'Linear Algebra Essentials', subject: 'Mathematics', size: 2700000, tags: ['math', 'algebra', 'vectors'], uploader: bob.id, downloads: 32, rating: 4.1 },
      { filename: 'data_structures.pdf', title: 'Data Structures & Algorithms', subject: 'Computer Science', size: 3500000, tags: ['dsa', 'algorithms', 'programming'], uploader: alice.id, downloads: 50, rating: 4.8 },
      { filename: 'organic_chemistry.pdf', title: 'Organic Chemistry Basics', subject: 'Chemistry', size: 3100000, tags: ['chemistry', 'organic'], uploader: diana.id, downloads: 18, rating: 3.9 },
      { filename: 'operating_systems.pdf', title: 'Operating Systems Concepts', subject: 'Computer Science', size: 4500000, tags: ['os', 'systems', 'kernel'], uploader: bob.id, downloads: 38, rating: 4.4 },
      { filename: 'calculus_notes.pdf', title: 'Calculus I & II Notes', subject: 'Mathematics', size: 2200000, tags: ['calculus', 'math', 'notes'], uploader: charlie.id, downloads: 22, rating: 3.7 },
      { filename: 'networks.pdf', title: 'Computer Networks', subject: 'Computer Science', size: 3800000, tags: ['networking', 'tcp', 'protocols'], uploader: alice.id, downloads: 44, rating: 4.6 },
      { filename: 'probability.pdf', title: 'Probability & Statistics', subject: 'Mathematics', size: 2600000, tags: ['statistics', 'probability', 'math'], uploader: bob.id, downloads: 27, rating: 4.0 },
      { filename: 'digital_electronics.pdf', title: 'Digital Electronics', subject: 'Electronics', size: 3000000, tags: ['electronics', 'digital', 'circuits'], uploader: diana.id, downloads: 20, rating: 3.5 },
      { filename: 'machine_learning.pdf', title: 'Machine Learning Fundamentals', subject: 'Computer Science', size: 5200000, tags: ['ml', 'ai', 'deep-learning'], uploader: alice.id, downloads: 60, rating: 4.7 },
      { filename: 'compiler_design.pdf', title: 'Compiler Design', subject: 'Computer Science', size: 3400000, tags: ['compilers', 'parsing', 'languages'], uploader: charlie.id, downloads: 15, rating: 3.6 },
    ];

    for (const sr of seedResources) {
      const r = this.createResource(sr.filename, sr.size, sr.uploader, {
        title: sr.title,
        subject: sr.subject,
        tags: sr.tags,
        description: `Comprehensive study material on ${sr.title.toLowerCase()}.`,
      });
      r.download_count = sr.downloads;
      r.total_ratings = 3;
      r.ratings_sum = sr.rating * 3;
      r.average_rating = sr.rating;
      // Set created_at to staggered past dates
      r.created_at = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Fix user upload counts and stats
    for (const user of this.getAllUsers()) {
      const userResources = this.getAllResources().filter(r => r.uploaded_by === user.id);
      user.total_uploads = userResources.length;
      const rated = userResources.filter(r => r.total_ratings > 0);
      if (rated.length > 0) {
        user.average_rating = parseFloat((rated.reduce((s, r) => s + r.average_rating, 0) / rated.length).toFixed(1));
      }
      user.reputation = parseFloat(((user.total_uploads * 2) + (user.average_rating * 10)).toFixed(1));
      user.classification = classifyUser(user.total_uploads, 0);
    }
  }
}

// Singleton — survives across API route invocations within the same serverless instance
const globalStore = globalThis as unknown as { __store?: DataStore };
if (!globalStore.__store) {
  globalStore.__store = new DataStore();
}

export const store: DataStore = globalStore.__store;

// Helper to strip password from user before sending to client
export function sanitizeUser(u: StoreUser): Omit<StoreUser, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = u;
  return safe;
}
