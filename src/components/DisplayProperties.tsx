import { Group, Pagination } from "@mantine/core";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PropertyCard } from "~/components/PropertyCard";
import { useProperties } from "~/hooks/useQueries";
import type { CollectionProperty, DisplayPropertiesProps } from "~/types";

export function DisplayProperties({ search }: DisplayPropertiesProps) {
  const { data: session, status } = useSession();
  const [activePage, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const {
    data: propData,
    isLoading,
    isError,
  } = useProperties({
    session,
    status,
    search,
    page: activePage,
  });

  const properties = propData?.data;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading properties.</div>;
  }

  const renderProperties = (properties: CollectionProperty[] | undefined) => {
    if (!properties) {
      return <></>;
    }

    return (
      <>
        {properties.map((property: CollectionProperty) => {
          const url = `/properties/${property.id}`;
          return (
            <Link href={url} key={property.id}>
              <PropertyCard
                image={property.cover_url}
                title={property.title}
                author={property.type}
                key={property.id}
              />
            </Link>
          );
        })}
      </>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {renderProperties(properties)}
      </div>

      <Pagination.Root value={activePage} onChange={setPage} total={propData.meta.last_page}>
        <Group spacing={5} position="center" className="mt-4">
          <Pagination.First />
          <Pagination.Previous />
          <Pagination.Items />
          <Pagination.Next />
          <Pagination.Last />
        </Group>
      </Pagination.Root>
    </>
  );
}