import { type DrawPolygon } from "@mapbox/mapbox-gl-draw";
import { useQuery } from "@tanstack/react-query";
import { type Session } from "next-auth";
import { makeRequest } from "~/lib/requestHelper";
import type {
  Property,
  Links,
  Meta,
  Collection,
  CollectionWithProperties,
  CollectionProperty,
  Tag,
  FiltersOptions,
  AdministrativeDivision,
  TagManage,
  BareCharacteristic,
  PropertyTitle,
} from "~/types";

type CollectionsResponse = {
  data: Collection[];
  links: Links;
  meta: Meta;
};

type SidebarCollectionsResponse = {
  data: Collection[];
  total: string;
};

type CollectionResponse = {
  data: CollectionWithProperties;
};

type PropertyResponse = {
  data: Property;
};

export type PropertiesResponse = {
  data: CollectionProperty[];
  links: Links;
  meta: Meta;
};

export type CharacteristicsResponse = {
  data: BareCharacteristic[];
  links: Links;
  meta: Meta;
};

type TagsResponse = {
  data: Tag[];
};

type TagsManageResponse = {
  data: TagManage[];
  links: Links;
  meta: Meta;
};

type AdmsResponse = {
  data: AdministrativeDivision[];
};

type UseElement = {
  session: Session | null;
  status: string;
};

type UseElementWithElementId = {
  session: Session | null;
  status: string;
  elementId: string;
  enabled?: boolean;
};

type UseElementWithElementIdAndPageNumber = {
  session: Session | null;
  status: string;
  elementId: string;
  page: number;
};

type UseElementWithPageNumber = {
  session: Session | null;
  status: string;
  page: number;
};

type UseProperties = {
  session: Session | null;
  status: string;
  search: string;
  filters: FiltersOptions;
  page: number;
  enabled?: boolean;
};

type UsePropertyTitles = {
  session: Session | null;
  status: string;
  search: string;
};

type UsePolygonProperties = UseProperties & {
  polygon: DrawPolygon | null;
};

type UseAdms = {
  session: Session | null;
  status: string;
  parentId: string;
};

type UseAdmsWithoutParent = {
  session: Session | null;
  status: string;
};

type StatsPrice = {
  sale: number | null;
  rent: number | null;
};

type CapStats = {
  count: number;
  avg: number;
  price: StatsPrice;
};

export type CapStatsName = {
  id?: number;
  name: string;
} & CapStats;

type Statistics = {
  total: {
    properties: number;
    tags: number;
    lists: number;
    offers: number;
  };
  properties: {
    [type: string]: CapStats;
  };
  listings: {
    [listing_type: string]: number;
  };
  tags: CapStatsName[];
  lists: CapStatsName[];
};

const fetchStatistics = async (session: Session | null) => {
  const response = (await makeRequest(`me/statistics`, "GET", session?.user.access_token)) as Statistics;
  return response;
};

const fetchCollection = async (session: Session | null, id: string, page: number) => {
  const response = (await makeRequest(
    `me/lists/${id}?page=${page}`,
    "GET",
    session?.user.access_token
  )) as CollectionResponse;
  return response.data;
};

/* Keep this one to paginate the collections page? */
const fetchCollections = async (session: Session | null, page = 1) => {
  const response = (await makeRequest(
    `me/lists?page=${page}`,
    "GET",
    session?.user.access_token
  )) as CollectionsResponse;
  return response;
};

const fetchPropertyTitles = async (session: Session | null, search: string) => {
  let extra = "";
  if (search) extra += `?query=${encodeURIComponent(search)}`;
  const response = (await makeRequest(`me/properties/titles${extra}`, "GET", session?.user.access_token)) as {
    data: PropertyTitle[];
  };
  return response.data;
};

const fetchAllCollections = async (session: Session | null) => {
  const response = (await makeRequest("me/lists/all", "GET", session?.user.access_token)) as SidebarCollectionsResponse;
  return response;
};

const fetchSidebarCollections = async (session: Session | null) => {
  const response = (await makeRequest(
    "me/lists/sidebar",
    "GET",
    session?.user.access_token
  )) as SidebarCollectionsResponse;
  return response;
};

const fetchProperty = async (session: Session | null, id: string) => {
  const response = (await makeRequest(`me/properties/${id}`, "GET", session?.user.access_token)) as PropertyResponse;
  return response.data;
};

const processSearch = (search: string, filters: FiltersOptions) => {
  let extraFields = "";
  if (search) extraFields += `&query=${encodeURIComponent(search)}`;
  if (filters.list) extraFields += `&list_id=${encodeURIComponent(filters.list)}`;
  //if (filters.adm) extraFields += `&adm_id=${encodeURIComponent(filters.adm)}`;
  if (filters.include_tags) extraFields += `&include_tags=${encodeURIComponent(JSON.stringify(filters.include_tags))}`;
  if (filters.exclude_tags) extraFields += `&exclude_tags=${encodeURIComponent(JSON.stringify(filters.exclude_tags))}`;
  if (filters.minArea) extraFields += `&area_min=${encodeURIComponent(filters.minArea)}`;
  if (filters.maxArea) extraFields += `&area_max=${encodeURIComponent(filters.maxArea)}`;
  if (filters.minPrice) extraFields += `&price_min=${encodeURIComponent(filters.minPrice)}`;
  if (filters.maxPrice) extraFields += `&price_max=${encodeURIComponent(filters.maxPrice)}`;
  if (filters.ratingRange && filters.ratingRange[0])
    extraFields += `&rating_min=${encodeURIComponent(filters.ratingRange[0])}`;
  if (filters.ratingRange && filters.ratingRange[1])
    extraFields += `&rating_max=${encodeURIComponent(filters.ratingRange[1])}`;
  if (filters.wcs) extraFields += `&wc=${filters.wcs}`;

  if (filters.listingPropertyFilters) {
    let ltIdx = 0;
    let sIdx = 0;
    let tIdx = 0;
    filters.listingPropertyFilters.forEach((f) => {
      const fs = f.split("|");
      if (fs.length > 1 && fs[1]) {
        if (f.startsWith("listing_type")) {
          extraFields += `&lt[${encodeURIComponent(ltIdx)}]=${encodeURIComponent(fs[1])}`;
          ltIdx++;
        } else if (f.startsWith("status")) {
          extraFields += `&s[${encodeURIComponent(sIdx)}]=${encodeURIComponent(fs[1])}`;
          sIdx++;
        } else if (f.startsWith("type")) {
          extraFields += `&t[${encodeURIComponent(tIdx)}]=${encodeURIComponent(fs[1])}`;
          tIdx++;
        }
      }
    });
  }

  if (filters.typology)
    filters.typology.forEach(
      (type, idx) => (extraFields += `&tl[${encodeURIComponent(idx)}]=${encodeURIComponent(type)}`)
    );

  if (filters.addressSearch) extraFields += `&address=${encodeURIComponent(filters.addressSearch)}`;

  return extraFields;
};

const fetchProperties = async (session: Session | null, search: string, filters: FiltersOptions = {}, page = 1) => {
  const extraFields = processSearch(search, filters);

  const response = (await makeRequest(
    `me/properties?page=${page}${extraFields}`,
    "GET",
    session?.user.access_token
  )) as PropertiesResponse;

  return response;
};

const fetchTrashedProperties = async (session: Session | null, page = 1) => {
  const response = (await makeRequest(
    `me/properties/trashed?page=${page}`,
    "GET",
    session?.user.access_token
  )) as PropertiesResponse;

  return response;
};

const fetchCharacteristicsPaginated = async (session: Session | null, page = 1) => {
  const response = (await makeRequest(
    `me/characteristics/paginated?page=${page}`,
    "GET",
    session?.user.access_token
  )) as CharacteristicsResponse;

  return response;
};

const fetchAllTags = async (session: Session | null) => {
  const response = (await makeRequest("me/tags/all", "GET", session?.user.access_token)) as TagsResponse;
  return response.data;
};

const fetchTagsManage = async (session: Session | null, page = 1) => {
  const response = (await makeRequest(`me/tags?page=${page}`, "GET", session?.user.access_token)) as TagsManageResponse;
  return response;
};

const fetchTagsSidebar = async (session: Session | null) => {
  const response = (await makeRequest("me/tags/sidebar", "GET", session?.user.access_token)) as TagsResponse;
  return response.data;
};

const fetchAdms = async (session: Session | null, level: number, parentId: string | null) => {
  const response = (await makeRequest(
    `administrative-divisions/level/${level}${parentId ? `?parent_id=${parentId}` : ""}`,
    "GET",
    session?.user.access_token
  )) as AdmsResponse;
  return response.data;
};

const fetchPropertiesInPolygon = async (
  session: Session | null,
  search: string,
  filters: FiltersOptions = {},
  polygon: DrawPolygon | null,
  page = 1
) => {
  let coords = "";
  if (polygon && polygon.coordinates.length > 0) {
    polygon.coordinates[0]?.forEach((coord, index) => {
      if (coord && coord[0] && coord[1])
        coords += `&p[${index}][x]=${encodeURIComponent(coord[1])}&p[${index}][y]=${encodeURIComponent(coord[0])}`;
    });
  }
  const extraFields = coords + processSearch(search, filters);
  const response = (await makeRequest(
    `me/properties/polygon?page=${page}${extraFields}`,
    "GET",
    session?.user.access_token
  )) as PropertiesResponse;

  return response;
};

export const useCollection = ({
  session,
  status,
  elementId: collectionId,
  page,
}: UseElementWithElementIdAndPageNumber) => {
  return useQuery({
    queryKey: ["collection", collectionId, page],
    queryFn: () => fetchCollection(session, collectionId, page),
    enabled: status === "authenticated",
  });
};

export const useCollections = ({ session, status, page }: UseElementWithPageNumber) => {
  return useQuery({
    queryKey: ["collections", page],
    queryFn: () => fetchCollections(session, page),
    enabled: status === "authenticated",
  });
};

export const useSidebarCollections = ({ session, status }: UseElement) => {
  return useQuery({
    queryKey: ["collectionsSidebar"],
    queryFn: () => fetchSidebarCollections(session),
    enabled: status === "authenticated",
    staleTime: Infinity,
  });
};

export const useAllCollections = ({ session, status }: UseElement) => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => fetchAllCollections(session),
    enabled: status === "authenticated",
  });
};

export const useProperty = ({ session, status, elementId: propertyId, enabled = true }: UseElementWithElementId) => {
  return useQuery<Property>({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(session, propertyId),
    enabled: status === "authenticated" && enabled,
  });
};

export const useProperties = ({ session, status, search, filters, page, enabled = true }: UseProperties) => {
  return useQuery({
    queryKey: ["properties", search, filters, page],
    queryFn: () => fetchProperties(session, search, filters, page),
    enabled: status === "authenticated" && enabled,
  });
};

export const usePropertyTitles = ({ session, status, search }: UsePropertyTitles) => {
  return useQuery({
    queryKey: ["propertyTitles", search],
    queryFn: () => fetchPropertyTitles(session, search),
    enabled: status === "authenticated",
  });
};

export const useTrashedProperties = ({ session, status, page }: UseElementWithPageNumber) => {
  return useQuery({
    queryKey: ["trashed_properties", page],
    queryFn: () => fetchTrashedProperties(session, page),
    enabled: status === "authenticated",
  });
};

export const usePolygonProperties = ({ session, status, search, filters, polygon, page }: UsePolygonProperties) => {
  return useQuery({
    queryKey: ["properties", polygon, search, filters, page],
    queryFn: () => fetchPropertiesInPolygon(session, search, filters, polygon, page),
    enabled: status === "authenticated",
  });
};

export const useAllTags = ({ session, status }: UseElement) => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => fetchAllTags(session),
    enabled: status === "authenticated",
  });
};

export const useTagsManage = ({ session, status, page }: UseElementWithPageNumber) => {
  return useQuery({
    queryKey: ["tagsManage", page],
    queryFn: () => fetchTagsManage(session, page),
    enabled: status === "authenticated",
  });
};

export const useCharacteristicsPaginated = ({ session, status, page }: UseElementWithPageNumber) => {
  return useQuery({
    queryKey: ["characteristicsPaginated", page],
    queryFn: () => fetchCharacteristicsPaginated(session, page),
    enabled: status === "authenticated",
  });
};

export const useTagsSidebar = ({ session, status }: UseElement) => {
  return useQuery({
    queryKey: ["tagsSidebar"],
    queryFn: () => fetchTagsSidebar(session),
    enabled: status === "authenticated",
    staleTime: Infinity,
  });
};

export const useAdms = ({ session, status }: UseAdmsWithoutParent) => {
  return useQuery({
    queryKey: ["adms1"],
    queryFn: () => fetchAdms(session, 1, null),
    enabled: status === "authenticated",
    staleTime: Infinity,
  });
};

export const useAdms2 = ({ session, status, parentId }: UseAdms) => {
  return useQuery({
    queryKey: ["adms2_" + parentId],
    queryFn: () => fetchAdms(session, 2, parentId),
    enabled: status === "authenticated",
    staleTime: Infinity,
  });
};

export const useAdms3 = ({ session, status, parentId }: UseAdms) => {
  return useQuery({
    queryKey: ["adms3_" + parentId],
    queryFn: () => fetchAdms(session, 3, parentId),
    enabled: status === "authenticated",
    staleTime: Infinity,
  });
};

export const useStatistics = ({ session, status }: UseElement) => {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: () => fetchStatistics(session),
    enabled: status === "authenticated",
  });
};
