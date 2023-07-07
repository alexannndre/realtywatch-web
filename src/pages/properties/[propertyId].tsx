import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useProperty } from "~/hooks/useQueries";
import { Property } from "~/types";
import { CardsCarousel } from "~/components/CardsCarousel";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { type FunctionComponent, type SVGProps, useEffect, useState } from "react";
import { Apartment, House, Office, Shop, Warehouse, Garage, Default } from "public/icons";
import { MainCarousel } from "~/components/MainCarousel";
import { useDisclosure } from "@mantine/hooks";
import { Button, Drawer, Group } from "@mantine/core";
import CardBackground from "~/components/CardBackground";
import { env } from "~/env.mjs";
import { IconPhoto, IconPhotoCheck, IconPhotoX, IconTrash, IconVideo, IconWallpaper } from "@tabler/icons-react";
import { makeRequest } from "~/lib/requestHelper";
import { errorNotification, successNotification } from "~/components/PropertyCard";

type MarkerIconComponent = FunctionComponent<SVGProps<SVGSVGElement>>;

const markerIcons: { [key: string]: MarkerIconComponent } = {
  house: House,
  apartment: Apartment,
  office: Office,
  shop: Shop,
  warehouse: Warehouse,
  garage: Garage,
  default: Default,
};

const Property: NextPage = () => {
  const router = useRouter();
  const { propertyId } = router.query;

  const { data: session, status } = useSession();
  const { data: property, isLoading, isError } = useProperty({ session, status, elementId: String(propertyId ?? "") });

  const [coverUrl, setCoverUrl] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");
  const [imagesOpened, { open: openImages, close: closeImages }] = useDisclosure(false);
  const [videosOpened, { open: openVideos, close: closeVideos }] = useDisclosure(false);
  const [blueprintsOpened, { open: openBlueprints, close: closeBlueprints }] = useDisclosure(false);

  useEffect(() => {
    if (!isLoading && !isError && property) {
      setCoverUrl(property.cover_url);
    }
  }, [isLoading, isError, property]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading property.</div>;
  }

  const photos = property?.media?.photos;
  const videos = property?.media?.videos;
  const blueprints = property?.media?.blueprints;
  const coordinates = property?.address?.coordinates;

  const renderHeader = () => {
    return (
      <>
        <div className="mb-2 flex justify-between">
          <h1 className="text-3xl">{property.title}</h1>
          {property.current_price_sale ? (
            <div className="text-3xl">{property.current_price_sale}€</div>
          ) : (
            <div className="text-3xl">{property.current_price_rent}€</div>
          )}
        </div>
      </>
    );
  };

  const renderCover = () => {
    if (coverUrl == null) return <div>Loading...</div>;
    return (
      <>
        {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3"> */}
        {/* <span onClick={open}> */}
        <MainCarousel images={photos} setSelectedUrl={setSelectedUrl} />
        {/* </span> */}
        {/* </div> */}
      </>
    );
  };

  const renderImageDrawer = () => {
    return (
      <Drawer opened={imagesOpened} onClose={closeImages} position="bottom" size="100%">
        <div className="flex h-screen items-center">
          <CardsCarousel data={photos} currentUrl={coverUrl} setCover={setCoverUrl} />
        </div>
      </Drawer>
    );
  };

  const renderVideoDrawer = () => {
    return (
      <Drawer opened={videosOpened} onClose={closeVideos} position="bottom" size="100%">
        <div className="flex h-screen items-center">
          <CardsCarousel data={videos} isImage={false} />
        </div>
      </Drawer>
    );
  };

  const renderBlueprintDrawer = () => {
    return (
      <Drawer opened={blueprintsOpened} onClose={closeBlueprints} position="bottom" size="100%">
        <div className="flex h-screen items-center">
          <CardsCarousel data={blueprints} />
        </div>
      </Drawer>
    );
  };

  const renderDescription = (property: Property) => {
    return (
      <div className="mt-4">
        <h2 className="text-3xl">Description</h2>
        <div>{property.description}</div>
      </div>
    );
  };

  const markerType = property?.type?.toLowerCase();
  const MarkerIcon = (markerIcons[markerType] as MarkerIconComponent) || markerIcons.default;

  const renderMap = () => {
    //TODO: If coordinates are null? Can they even be null?
    const latitude = coordinates.latitude;
    const longitude = coordinates.longitude;

    return (
      <>
        <h2 className="my-2 text-3xl">Location</h2>
        <div className="h-3/6 w-auto">
          <Map
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={{
              longitude,
              latitude,
              zoom: 15,
            }}
            style={{ width: "100%", height: "400px", borderRadius: "12px" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            <Marker longitude={longitude} latitude={latitude}>
              <MarkerIcon className="h-8" />
            </Marker>
          </Map>
        </div>
      </>
    );
  };

  const trashProperty = () => {
    if (!property?.id) return;
    makeRequest(`me/properties/${property.id}`, "DELETE", session?.user.access_token)
      .then(() => {
        const sendSuccess = () => {
          successNotification("This property has been sent to trash!", "Property deleted");
        };
        router.push("/properties").then(sendSuccess).catch(sendSuccess); //TODO: Should we redirect to trash?
      })
      .catch((err) => {
        errorNotification("An unknown error occurred while deleting this property.");
        //TODO
        console.log("Error: ", err, " when trashing property.");
      });
  };

  const coverButtonClick = () => {
    if (!property?.id) return;
    if (selectedUrl == "" || !selectedUrl) return;

    if (property.cover_url != selectedUrl) {
      const formData = new FormData();
      formData.append("cover_url", selectedUrl);
      makeRequest(`me/properties/${property.id}/cover`, "PATCH", session?.user.access_token, formData)
        .then(() => {
          successNotification("The property's cover was set to the current image.", "Cover was set");
        })
        .catch(() => errorNotification("An unknown error occurred while setting this property's cover."));
    } else {
      makeRequest(`me/properties/${property.id}/cover`, "DELETE", session?.user.access_token)
        .then(() => {
          successNotification("The property's cover has been removed.", "Cover removed");
        })
        .catch(() => errorNotification("An unknown error occurred while removing this property's cover."));
    }
  };

  return (
    <>
      <Head>
        <title>{property.title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CardBackground className="pt-6">
        {renderHeader()}
        {renderCover()}
        {renderImageDrawer()}
        {renderVideoDrawer()}
        {renderBlueprintDrawer()}

        {/* TODO: Test Button */}
        <Group position="left" className="mt-4">
          <Button.Group>
            <Button
              disabled={photos.length < 2} // If it only has a photo, it's the cover
              onClick={openImages}
              variant="light"
              leftIcon={<IconPhoto size="1rem" className="-mr-1" />}
            >
              Images
            </Button>
            <Button
              disabled={videos.length == 0}
              onClick={openVideos}
              variant="light"
              leftIcon={<IconVideo size="1rem" className="-mr-1" />}
            >
              Videos
            </Button>
            <Button
              disabled={blueprints.length == 0}
              onClick={openBlueprints}
              variant="light"
              leftIcon={<IconWallpaper size="1rem" className="-mr-1" />}
            >
              Blueprints
            </Button>
          </Button.Group>
          <Button
            disabled={photos.length < 2 && selectedUrl != ""} // If it only has a photo, it's the cover
            color="yellow"
            variant="default"
            onClick={coverButtonClick}
            leftIcon={
              property.cover_url != selectedUrl ? (
                <IconPhotoCheck size="1rem" className="-mb-0.5 -mr-1" />
              ) : (
                <IconPhotoX size="1rem" className="-mr-1" />
              )
            }
          >
            {property.cover_url != selectedUrl ? "Set as cover" : "Remove cover"}
          </Button>
          <Button
            onClick={trashProperty}
            color="red"
            variant="light"
            leftIcon={<IconTrash size="1rem" className="-mr-1" />}
          >
            Delete
          </Button>
        </Group>

        <div className="-ml-6 -mr-6 border-b border-shark-700 pb-4" />

        {renderDescription(property)}

        <div className="-ml-6 -mr-6 border-b border-shark-700 pb-4" />

        {coordinates && renderMap()}
      </CardBackground>
    </>
  );
};

export default Property;
