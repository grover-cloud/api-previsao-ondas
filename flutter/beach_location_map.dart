import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class BeachLocationMap extends StatelessWidget {
  final double latitude;
  final double longitude;

  const BeachLocationMap({
    super.key,
    required this.latitude,
    required this.longitude,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Localização da Praia',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 250,
          child: FlutterMap(
            options: MapOptions(
              center: LatLng(latitude, longitude),
              zoom: 12.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c'],
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    width: 40,
                    height: 40,
                    point: LatLng(latitude, longitude),
                    builder: (context) => const Icon(
                      Icons.place,
                      color: Colors.red,
                      size: 32,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
