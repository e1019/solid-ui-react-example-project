/**
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { useEffect, useState } from "react";

import {
  useSession,
  CombinedDataProvider,
  Image,
  LogoutButton,
  Text,
  Value,
} from "@inrupt/solid-ui-react";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardActionArea,
  CardContent,
  Container,
  Typography,
  Input,
} from "@material-ui/core";

import BusinessIcon from "@material-ui/icons/Business";

import { FOAF, VCARD } from "@inrupt/lit-generated-vocab-common";
import { addStringNoLocale, addUrl, asUrl, createSolidDataset, createThing, getSolidDataset, getStringNoLocale, getThing, getThingAll, getUrl, getUrlAll, removeThing, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";

const TEST_TYPE = "https://example.com/test_type"
const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const TEXT = "https://schema.org/text";

export default function Form(): React.ReactElement {
  const { session } = useSession();
  const { webId } = session.info;


  const opts = { fetch: session.fetch };

  const [indexUrl, setIndexUrl] = useState("");

  const [editing, setEditing] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [elementsList, setElementsList] = useState([]);

  useEffect(() => {
    (async () => {
      const profileDataset = await getSolidDataset(webId, opts);
      const profile = getThing(profileDataset, webId);
      const podUrl = getUrlAll(profile, "http://www.w3.org/ns/pim/space#storage")[0];

      const newIndexUrl = podUrl + "example_error";
      setIndexUrl(newIndexUrl);

      const newDataset = createSolidDataset();

      const curr_dataset = await saveSolidDatasetAt(newIndexUrl, newDataset, opts);

      setDataset(curr_dataset);
      on_update();
    })();
  }, [session, setDataset, setIndexUrl]);

  const on_update = async () => {
    if(!indexUrl) return;

    const curr_dataset = await getSolidDataset(indexUrl, opts);
    setDataset(curr_dataset);

    let thingsList = getThingAll(curr_dataset);
    thingsList = thingsList.filter((thing) => (getUrl(thing, TYPE) === TEST_TYPE));

    setElementsList(thingsList.map((thing) => {
      const txt = getStringNoLocale(thing, TEXT)
      return (
          <li>{txt} <Button onClick={() => {remove_thing(asUrl(thing, ""))}}>Delete</Button></li>
      );
    }));
  }

  const create_thing = async (txt) => {
    if(!dataset) return;

    let testThing = createThing();

    console.log("Set " + TEXT + " to " + txt);
    testThing = addStringNoLocale(testThing, TEXT, txt);

    console.log("Set " + TYPE + " to " + TEST_TYPE);
    testThing = addUrl(testThing, TYPE, TEST_TYPE);

    const updatedDataset = setThing(dataset, testThing);

    console.log("Save to " + indexUrl);
    const finalDataset = await saveSolidDatasetAt(indexUrl, updatedDataset, opts);

    setDataset(finalDataset);
    on_update();
  }

  const remove_thing = async (url) => {
    if(!dataset) return;
    
    const thing = getThing(dataset, url);
    const updatedDataset = removeThing(dataset, thing);

    const finalDataset = await saveSolidDatasetAt(indexUrl, updatedDataset, opts);
    setDataset(finalDataset);
    on_update();
  }

  
  const [nametext, setnametext] = useState("");
  const onChange = (event) => {
    setnametext(event.target.value);
  }

  return (
    <Container fixed>
      <Box style={{ marginBottom: 16, textAlign: "right" }}>
        <LogoutButton>
          <Button variant="contained" color="primary">
            Log&nbsp;out
          </Button>
        </LogoutButton>
      </Box>
      <CombinedDataProvider datasetUrl={webId} thingUrl={webId}>
        <Card style={{ maxWidth: 480 }}>
          <CardActionArea
            style={{
              justifyContent: "center",
              display: "flex",
            }}
          >
          </CardActionArea>

          <CardContent>
            <Typography variant="body2" color="textSecondary" component="p">
              {"Born: "}
              {elementsList}
            </Typography>
          </CardContent>

          <CardActions>
            <Input type="text" placeholder="Name" onChange={onChange} />
            <Button
              size="small"
              color="primary"
              onClick={() => create_thing(nametext)}
            >
              Create
            </Button>
          </CardActions>
        </Card>
      </CombinedDataProvider>
    </Container>
  );
}
