"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "lib/utils";
import { UserCard } from "./UserCard";
import { Button } from "ui/button";
import { Input } from "ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { Badge } from "ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Search, Filter, Grid, List, CheckCircle, XCircle } from "lucide-react";
import type { UserEntity } from "@/lib/db/pg/schema.pg";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "table";
type SortField = "name" | "email" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "verified" | "unverified";

interface UsersResponse {
  users: UserEntity[];
  total: number;
  page: number;
  limit: number;
}

export function UserList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 12;

  // Construct query params
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: limit.toString(),
    sort: `${sortField}:${sortOrder}`,
    ...(searchQuery && { search: searchQuery }),
    ...(filterStatus !== "all" && { status: filterStatus }),
  });

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?${queryParams.toString()}`,
    fetcher,
  );

  const handleEdit = (user: UserEntity) => {
    // TODO: Open edit modal/form
    console.log("Edit user:", user);
  };

  const handleView = (user: UserEntity) => {
    // TODO: Open view modal/details
    console.log("View user:", user);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const renderUserRow = (user: UserEntity) => {
    const initials = user.name
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <TableRow key={user.id} className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {user.emailVerified ? (
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1 w-fit"
            >
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1 w-fit"
            >
              <XCircle className="h-3 w-3" />
              Unverified
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleView(user)}>
              View
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
              Edit
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Failed to load users</div>
        <Button onClick={() => mutate()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(value: FilterStatus) => {
              setFilterStatus(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {data && (
        <div className="text-sm text-muted-foreground">
          Showing {data.users.length} of {data.total} users
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded h-16" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {data && data.users.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    User{" "}
                    {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("createdAt")}
                  >
                    Joined{" "}
                    {sortField === "createdAt" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Last Active{" "}
                    {sortField === "updatedAt" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{data.users.map(renderUserRow)}</TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data.total > limit && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage} of {Math.ceil(data.total / limit)}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= Math.ceil(data.total / limit)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {data && data.users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery || filterStatus !== "all"
              ? "No users found matching your criteria"
              : "No users found"}
          </div>
          {(searchQuery || filterStatus !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
